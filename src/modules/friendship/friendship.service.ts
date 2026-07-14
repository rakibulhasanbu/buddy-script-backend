import { EFriendshipStatus } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";

import {
  FriendListResponse,
  FriendshipResponse,
  SendRequestInput,
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

  await prisma.friendship.delete({ where: { id: friendshipId } });
};

const getPendingRequests = async (currentUserId: string): Promise<FriendListResponse> => {
  const friendships = await prisma.friendship.findMany({
    where: {
      addresseeId: currentUserId,
      status: EFriendshipStatus.PENDING,
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  return { data: friendships.map(buildFriendshipResponse) };
};

const getFriends = async (currentUserId: string): Promise<FriendListResponse> => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: EFriendshipStatus.ACCEPTED,
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: userSelect },
      addressee: { select: userSelect },
    },
  });

  return { data: friendships.map(buildFriendshipResponse) };
};

const getSuggestions = async (currentUserId: string): Promise<SuggestionListResponse> => {
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
  connectedUserIds.forEach((friendship) => {
    excludedIds.add(friendship.requesterId);
    excludedIds.add(friendship.addresseeId);
  });

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: Array.from(excludedIds) },
    },
    select: userSelect,
    take: 20,
  });

  return { data: users.map(buildFriendUser) };
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
