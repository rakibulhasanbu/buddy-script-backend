import { ENotificationEntity, ENotificationType } from "@prisma/client";

export type NotificationActor = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
};

export type NotificationGroup = {
  id: string;
  type: ENotificationType;
  entityType: ENotificationEntity | null;
  entityId: string | null;
  referenceId: string | null;
  actor: NotificationActor;
  actorCount: number;
  isRead: boolean;
  createdAt: Date;
};

export type NotificationListResponse = {
  data: NotificationGroup[];
  meta: {
    nextCursor: string | null;
  };
};

export type UnreadCountResponse = {
  count: number;
};

export type CreateNotificationInput = {
  userId: string;
  actorId: string;
  type: ENotificationType;
  entityType?: ENotificationEntity;
  entityId?: string;
  referenceId?: string;
};

export type NotificationFilters = {
  searchTerm?: string;
  type?: string;
  entityType?: string;
  isRead?: string;
};

export type MarkGroupReadInput = {
  groupId: string;
};
