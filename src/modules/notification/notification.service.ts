import { ENotificationEntity, ENotificationType, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import { getIO, getUserRoom } from "@/lib/socket";
import prisma from "@/lib/prisma";

import {
  CreateNotificationInput,
  NotificationActor,
  NotificationFilterOptions,
  NotificationGroup,
  NotificationListResponse,
  UnreadCountResponse,
} from "./notification.types";

const DEFAULT_PAGE_LIMIT = 20;
const GROUPING_WINDOW_DAYS = 7;
const GROUPING_WINDOW_MS = GROUPING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const actorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
};

const buildActor = (user: {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}): NotificationActor => ({
  ...user,
  name: `${user.firstName} ${user.lastName}`,
});

const encodeCursor = (createdAt: Date, id: string): string => {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64");
};

const decodeCursor = (cursor: string): { createdAt: Date; id: string } => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("ascii");
    const [createdAt, id] = decoded.split("|");
    return { createdAt: new Date(createdAt), id };
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid cursor");
  }
};

const buildGroupKey = (
  type: ENotificationType,
  entityType: ENotificationEntity | null,
  entityId: string | null,
): string => {
  return `${type}:${entityType ?? "null"}:${entityId ?? "null"}`;
};

const encodeGroupId = (key: string): string => {
  return Buffer.from(key).toString("base64");
};

const decodeGroupId = (
  groupId: string,
): { type: ENotificationType; entityType: ENotificationEntity | null; entityId: string | null } => {
  try {
    const decoded = Buffer.from(groupId, "base64").toString("ascii");
    const [type, entityType, entityId] = decoded.split(":");
    return {
      type: type as ENotificationType,
      entityType: entityType === "null" ? null : (entityType as ENotificationEntity),
      entityId: entityId === "null" ? null : entityId,
    };
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid group ID");
  }
};

const emitNotificationUpdate = (userId: string): void => {
  const io = getIO();
  if (io) {
    io.to(getUserRoom(userId)).emit("notification:update");
  }
};

const createNotification = async (payload: CreateNotificationInput): Promise<void> => {
  const { userId, actorId, type, entityType, entityId, referenceId } = payload;

  if (userId === actorId) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId,
      actorId,
      type,
      entityType,
      entityId,
      referenceId,
    },
  });

  emitNotificationUpdate(userId);
};

const createBulkNotifications = async (payloads: CreateNotificationInput[]): Promise<void> => {
  const uniquePayloads = payloads.filter(
    (payload, index, self) =>
      payload.userId !== payload.actorId &&
      self.findIndex(
        p =>
          p.userId === payload.userId &&
          p.actorId === payload.actorId &&
          p.type === payload.type &&
          p.entityId === payload.entityId,
      ) === index,
  );

  if (uniquePayloads.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: uniquePayloads.map(payload => ({
      userId: payload.userId,
      actorId: payload.actorId,
      type: payload.type,
      entityType: payload.entityType,
      entityId: payload.entityId,
      referenceId: payload.referenceId,
    })),
  });

  const recipientIds = [...new Set(uniquePayloads.map(p => p.userId))];
  recipientIds.forEach(userId => emitNotificationUpdate(userId));
};

const getGroupedNotifications = async (
  currentUserId: string,
  options: NotificationFilterOptions,
): Promise<NotificationListResponse> => {
  const limit = options.limit && options.limit > 0 && options.limit <= 50 ? options.limit : DEFAULT_PAGE_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;
  const unreadOnly = options.unreadOnly === "true";

  const where: Prisma.NotificationWhereInput = {
    userId: currentUserId,
    ...(unreadOnly && { isRead: false }),
    ...(cursor && {
      OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
    }),
  };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit * 3 + 1,
    include: {
      actor: { select: actorSelect },
    },
  });

  const groups = new Map<string, { key: string; items: typeof notifications }>();

  notifications.forEach(notification => {
    const key = buildGroupKey(notification.type, notification.entityType, notification.entityId);

    if (
      notification.type === ENotificationType.FRIEND_REQUEST ||
      notification.type === ENotificationType.FRIEND_REQUEST_ACCEPTED
    ) {
      const uniqueKey = `${key}:${notification.id}`;
      groups.set(uniqueKey, { key: uniqueKey, items: [notification] });
      return;
    }

    const existing = groups.get(key);
    if (existing) {
      const latestCreatedAt = existing.items[0].createdAt;
      const windowStart = new Date(latestCreatedAt.getTime() - GROUPING_WINDOW_MS);
      if (notification.createdAt >= windowStart) {
        existing.items.push(notification);
      } else {
        groups.set(`${key}:${notification.id}`, { key: `${key}:${notification.id}`, items: [notification] });
      }
    } else {
      groups.set(key, { key, items: [notification] });
    }
  });

  const groupedItems = Array.from(groups.values())
    .map((group): NotificationGroup => {
      const sortedItems = group.items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const latest = sortedItems[0];
      const actorIds = [...new Set(sortedItems.map(item => item.actorId))];

      return {
        id: encodeGroupId(group.key),
        type: latest.type,
        entityType: latest.entityType,
        entityId: latest.entityId,
        referenceId: latest.referenceId,
        actor: buildActor(latest.actor),
        actorCount: actorIds.length,
        isRead: sortedItems.every(item => item.isRead),
        createdAt: latest.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const hasMore = groupedItems.length > limit;
  const items = hasMore ? groupedItems.slice(0, limit) : groupedItems;
  const nextCursor =
    hasMore && items.length > 0
      ? encodeCursor(items[items.length - 1].createdAt, notifications[notifications.length - 1].id)
      : null;

  return { data: items, meta: { nextCursor } };
};

const getUnreadCount = async (currentUserId: string): Promise<UnreadCountResponse> => {
  const count = await prisma.notification.count({
    where: {
      userId: currentUserId,
      isRead: false,
    },
  });

  return { count };
};

const markGroupAsRead = async (currentUserId: string, groupId: string): Promise<void> => {
  const { type, entityType, entityId } = decodeGroupId(groupId);

  await prisma.notification.updateMany({
    where: {
      userId: currentUserId,
      type,
      entityType,
      entityId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  emitNotificationUpdate(currentUserId);
};

const markAllAsRead = async (currentUserId: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: {
      userId: currentUserId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  emitNotificationUpdate(currentUserId);
};

const deleteGroup = async (currentUserId: string, groupId: string): Promise<void> => {
  const { type, entityType, entityId } = decodeGroupId(groupId);

  await prisma.notification.deleteMany({
    where: {
      userId: currentUserId,
      type,
      entityType,
      entityId,
    },
  });

  emitNotificationUpdate(currentUserId);
};

const deleteNotificationsByEntity = async (entityType: ENotificationEntity, entityId: string): Promise<void> => {
  await prisma.notification.deleteMany({
    where: {
      entityType,
      entityId,
    },
  });
};

const deleteFriendRequestNotification = async (requesterId: string, addresseeId: string): Promise<void> => {
  await prisma.notification.deleteMany({
    where: {
      userId: addresseeId,
      actorId: requesterId,
      type: ENotificationType.FRIEND_REQUEST,
      entityType: ENotificationEntity.FRIENDSHIP,
    },
  });

  emitNotificationUpdate(addresseeId);
};

const upsertReactionNotification = async (payload: CreateNotificationInput): Promise<void> => {
  const { userId, actorId, type, entityType, entityId, referenceId } = payload;

  if (userId === actorId || !entityType || !entityId) {
    return;
  }

  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      actorId,
      type,
      entityType,
      entityId,
    },
  });

  if (existing) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId,
      actorId,
      type,
      entityType,
      entityId,
      referenceId,
    },
  });

  emitNotificationUpdate(userId);
};

const removeReactionNotification = async (
  userId: string,
  actorId: string,
  type: ENotificationType,
  entityType: ENotificationEntity,
  entityId: string,
): Promise<void> => {
  await prisma.notification.deleteMany({
    where: {
      userId,
      actorId,
      type,
      entityType,
      entityId,
    },
  });

  emitNotificationUpdate(userId);
};

export const NotificationService = {
  createNotification,
  createBulkNotifications,
  getGroupedNotifications,
  getUnreadCount,
  markGroupAsRead,
  markAllAsRead,
  deleteGroup,
  deleteNotificationsByEntity,
  deleteFriendRequestNotification,
  upsertReactionNotification,
  removeReactionNotification,
};
