import { EFriendshipStatus, ENotificationEntity, ENotificationType, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { NotificationService } from "@/modules/notification/notification.service";

import { paginationHelpers } from "@/utils/pagination";
import { queryBuilder } from "@/utils/query-builder";
import { PaginationOptions } from "@/types/pagination";

import {
  FriendListResponse,
  FriendshipFilters,
  FriendshipResponse,
  SendRequestInput,
  SuggestionFilters,
  SuggestionListResponse,
} from "./friendship.types";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  headline: true,
};

const buildFriendUser = (user: {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  headline: string | null;
}) => ({
  ...user,
  name: `${user.firstName} ${user.lastName}`,
});

const buildFriendshipResponse = (friendship: {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: EFriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  requester: { id: string; firstName: string; lastName: string; photoUrl: string | null; headline: string | null };
  addressee: { id: string; firstName: string; lastName: string; photoUrl: string | null; headline: string | null };
}): FriendshipResponse => ({
  ...friendship,
  requester: buildFriendUser(friendship.requester),
  addressee: buildFriendUser(friendship.addressee),
});

const sendRequest = async (currentUserId: string, payload: SendRequestInput): Promise<FriendshipResponse> => {
  const { addresseeId } = payload;

  if (currentUserId === addresseeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot send a friend request to yourself");
  }

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!addressee) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId },
        { requesterId: addresseeId, addresseeId: currentUserId },
      ],
    },
  });

  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "A friend request or friendship already exists with this user");
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: currentUserId,
      addresseeId,
      status: EFriendshipStatus.PENDING,
    },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  await NotificationService.createNotification({
    userId: addresseeId,
    actorId: currentUserId,
    type: ENotificationType.FRIEND_REQUEST,
    entityType: ENotificationEntity.FRIENDSHIP,
    entityId: friendship.id,
  });

  return buildFriendshipResponse(friendship);
};

const acceptRequest = async (currentUserId: string, friendshipId: string): Promise<FriendshipResponse> => {
  const existing = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Friend request not found");
  }

  if (existing.addresseeId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to accept this request");
  }

  if (existing.status !== EFriendshipStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This request is no longer pending");
  }

  const friendship = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: EFriendshipStatus.ACCEPTED },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  await NotificationService.deleteFriendRequestNotification(existing.requesterId, currentUserId);
  await NotificationService.createNotification({
    userId: existing.requesterId,
    actorId: currentUserId,
    type: ENotificationType.FRIEND_REQUEST_ACCEPTED,
    entityType: ENotificationEntity.FRIENDSHIP,
    entityId: friendship.id,
  });

  return buildFriendshipResponse(friendship);
};

const declineRequest = async (currentUserId: string, friendshipId: string): Promise<FriendshipResponse> => {
  const existing = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Friend request not found");
  }

  if (existing.addresseeId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to decline this request");
  }

  if (existing.status !== EFriendshipStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This request is no longer pending");
  }

  const friendship = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: EFriendshipStatus.DECLINED },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  await NotificationService.deleteFriendRequestNotification(existing.requesterId, currentUserId);

  return buildFriendshipResponse(friendship);
};

const cancelRequest = async (currentUserId: string, friendshipId: string): Promise<void> => {
  const existing = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Friend request not found");
  }

  if (existing.requesterId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to cancel this request");
  }

  await NotificationService.deleteFriendRequestNotification(existing.requesterId, existing.addresseeId);
  await prisma.friendship.delete({ where: { id: friendshipId } });
};

const getPendingRequests = async (
  currentUserId: string,
  filters: FriendshipFilters,
  paginationOptions: PaginationOptions = {},
): Promise<FriendListResponse> => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelpers.calculatePagination(paginationOptions);

  const { searchTerm, ...filterData } = filters;

  const baseWhere: Prisma.FriendshipWhereInput = {
    addresseeId: currentUserId,
    status: EFriendshipStatus.PENDING,
  };

  const extraConditions: Prisma.FriendshipWhereInput[] = [];

  if (searchTerm) {
    extraConditions.push({
      OR: [
        { requester: { firstName: { contains: searchTerm, mode: "insensitive" } } },
        { requester: { lastName: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (filterData.status) {
    extraConditions.push({ status: filterData.status as EFriendshipStatus });
  }

  const where: Prisma.FriendshipWhereInput = extraConditions.length > 0
    ? { AND: [baseWhere, ...extraConditions] }
    : baseWhere;

  const [friendships, total] = await Promise.all([
    prisma.friendship.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    }),
    prisma.friendship.count({ where }),
  ]);

  return { data: friendships.map(buildFriendshipResponse), meta: { page, limit, total } };
};

const getFriends = async (
  currentUserId: string,
  filters: FriendshipFilters,
  paginationOptions: PaginationOptions = {},
): Promise<FriendListResponse> => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelpers.calculatePagination(paginationOptions);

  const { searchTerm, ...filterData } = filters;

  const baseWhere: Prisma.FriendshipWhereInput = {
    status: EFriendshipStatus.ACCEPTED,
    OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
  };

  const extraConditions: Prisma.FriendshipWhereInput[] = [];

  if (searchTerm) {
    extraConditions.push({
      OR: [
        { requester: { firstName: { contains: searchTerm, mode: "insensitive" } } },
        { requester: { lastName: { contains: searchTerm, mode: "insensitive" } } },
        { addressee: { firstName: { contains: searchTerm, mode: "insensitive" } } },
        { addressee: { lastName: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (filterData.status) {
    extraConditions.push({ status: filterData.status as EFriendshipStatus });
  }

  const where: Prisma.FriendshipWhereInput = extraConditions.length > 0
    ? { AND: [baseWhere, ...extraConditions] }
    : baseWhere;

  const [friendships, total] = await Promise.all([
    prisma.friendship.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        requester: { select: userSelect },
        addressee: { select: userSelect },
      },
    }),
    prisma.friendship.count({ where }),
  ]);

  return { data: friendships.map(buildFriendshipResponse), meta: { page, limit, total } };
};

const getSuggestions = async (
  currentUserId: string,
  filters: SuggestionFilters,
  paginationOptions: PaginationOptions = {},
): Promise<SuggestionListResponse> => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelpers.calculatePagination(paginationOptions);

  const connectedUserIds = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  const excludedIds = new Set<string>([currentUserId]);
  connectedUserIds.forEach(friendship => {
    excludedIds.add(friendship.requesterId);
    excludedIds.add(friendship.addresseeId);
  });

  const searchWhere = queryBuilder.buildWhereClause<Prisma.UserWhereInput>({
    searchableFields: ["firstName", "lastName", "headline"],
    filterableFields: [],
    filters: filters as Record<string, unknown>,
  });

  const whereCondition: Prisma.UserWhereInput = {
    id: { notIn: Array.from(excludedIds) },
    ...(Object.keys(searchWhere).length > 0 ? searchWhere : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      select: userSelect,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.user.count({ where: whereCondition }),
  ]);

  return {
    data: users.map(buildFriendUser),
    meta: { page, limit, total },
  };
};

export const FriendshipService = {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  getPendingRequests,
  getFriends,
  getSuggestions,
};
