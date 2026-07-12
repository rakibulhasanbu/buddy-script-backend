import { EReactionEntity, EReactionType, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { ReactionCounts, ReactedUser, ToggleReactionInput, WhoReactedResponse } from "./reaction.types";

const DEFAULT_PAGE_LIMIT = 20;

const assertEntityExists = async (entityType: EReactionEntity, entityId: string) => {
  if (entityType === EReactionEntity.POST) {
    const post = await prisma.post.findUnique({ where: { id: entityId }, select: { id: true } });
    if (!post) throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: entityId }, select: { id: true } });
    if (!comment) throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }
};

const getReactionCounts = (counts: Prisma.JsonValue | null): ReactionCounts => {
  if (typeof counts === "object" && counts !== null && !Array.isArray(counts)) {
    return counts as ReactionCounts;
  }
  return {};
};

const updateCounts = (counts: ReactionCounts, previousType: EReactionType | null, nextType: EReactionType | null) => {
  if (previousType) {
    counts[previousType] = Math.max((counts[previousType] || 0) - 1, 0);
  }
  if (nextType) {
    counts[nextType] = (counts[nextType] || 0) + 1;
  }
};

const toggleReaction = async (payload: ToggleReactionInput, userId: string) => {
  const { entityType, entityId, type } = payload;

  await assertEntityExists(entityType, entityId);

  const result = await prisma.$transaction(async tx => {
    const existing = await tx.reaction.findUnique({
      where: {
        userId_entityType_entityId: {
          userId,
          entityType,
          entityId,
        },
      },
    });

    const entity =
      entityType === EReactionEntity.POST
        ? await tx.post.findUnique({ where: { id: entityId }, select: { reactionCounts: true } })
        : await tx.comment.findUnique({ where: { id: entityId }, select: { reactionCounts: true } });

    if (!entity) {
      throw new ApiError(httpStatus.NOT_FOUND, `${entityType === EReactionEntity.POST ? "Post" : "Comment"} not found`);
    }

    const counts = getReactionCounts(entity.reactionCounts);

    if (existing) {
      if (existing.type === type) {
        await tx.reaction.delete({ where: { id: existing.id } });
        updateCounts(counts, type, null);

        if (entityType === EReactionEntity.POST) {
          await tx.post.update({ where: { id: entityId }, data: { reactionCounts: counts as Prisma.InputJsonValue } });
        } else {
          await tx.comment.update({
            where: { id: entityId },
            data: { reactionCounts: counts as Prisma.InputJsonValue },
          });
        }

        return { action: "removed", type: null };
      }

      await tx.reaction.update({ where: { id: existing.id }, data: { type } });
      updateCounts(counts, existing.type, type);

      if (entityType === EReactionEntity.POST) {
        await tx.post.update({ where: { id: entityId }, data: { reactionCounts: counts as Prisma.InputJsonValue } });
      } else {
        await tx.comment.update({ where: { id: entityId }, data: { reactionCounts: counts as Prisma.InputJsonValue } });
      }

      return { action: "updated", type };
    }

    await tx.reaction.create({
      data: {
        userId,
        entityType,
        entityId,
        type,
      },
    });
    updateCounts(counts, null, type);

    if (entityType === EReactionEntity.POST) {
      await tx.post.update({ where: { id: entityId }, data: { reactionCounts: counts as Prisma.InputJsonValue } });
    } else {
      await tx.comment.update({ where: { id: entityId }, data: { reactionCounts: counts as Prisma.InputJsonValue } });
    }

    return { action: "added", type };
  });

  return result;
};

const getWhoReacted = async (
  entityType: EReactionEntity,
  entityId: string,
  cursor?: string,
  limit = DEFAULT_PAGE_LIMIT,
): Promise<WhoReactedResponse> => {
  const parsedCursor = cursor ? decodeCursor(cursor) : undefined;

  const reactions = await prisma.reaction.findMany({
    where: { entityType, entityId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    skip: parsedCursor ? 1 : 0,
    cursor: parsedCursor ? { id: parsedCursor.id } : undefined,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });

  const hasMore = reactions.length > limit;
  const items = hasMore ? reactions.slice(0, -1) : reactions;
  const nextCursor = hasMore && items.length > 0 ? encodeCursor(items[items.length - 1].id) : null;

  const data: ReactedUser[] = items.map(r => ({
    id: r.user.id,
    firstName: r.user.firstName,
    lastName: r.user.lastName,
    name: `${r.user.firstName} ${r.user.lastName}`,
    photoUrl: r.user.photoUrl,
    type: r.type,
    createdAt: r.createdAt,
  }));

  return { data, meta: { nextCursor } };
};

const getUserReactionsForEntities = async (
  entityType: EReactionEntity,
  entityIds: string[],
  userId: string,
): Promise<Map<string, EReactionType>> => {
  if (entityIds.length === 0) return new Map();

  const reactions = await prisma.reaction.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
      userId,
    },
    select: {
      entityId: true,
      type: true,
    },
  });

  return new Map(reactions.map(r => [r.entityId, r.type]));
};

const encodeCursor = (id: string): string => {
  return Buffer.from(id).toString("base64");
};

const decodeCursor = (cursor: string): { id: string } => {
  try {
    const id = Buffer.from(cursor, "base64").toString("ascii");
    return { id };
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid cursor");
  }
};

export const ReactionService = {
  toggleReaction,
  getWhoReacted,
  getUserReactionsForEntities,
  getReactionCounts,
};
