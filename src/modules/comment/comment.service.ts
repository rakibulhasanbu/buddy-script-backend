import { Comment, ENotificationEntity, ENotificationType, EVisibility, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { NotificationService } from "@/modules/notification/notification.service";
import { ReactionService } from "@/modules/reaction/reaction.service";
import { ReactionCounts } from "@/modules/reaction/reaction.types";
import {
  CommentFilterOptions,
  CommentListResponse,
  CommentResponse,
  CreateCommentInput,
  UpdateCommentInput,
} from "./comment.types";

const DEFAULT_PAGE_LIMIT = 10;

type CommentWithAuthor = Comment & {
  author: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
};

const buildCommentResponse = (comment: CommentWithAuthor, myReaction: string | null = null): CommentResponse => {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    content: comment.content,
    reactionCounts: (comment.reactionCounts as ReactionCounts) || {},
    replyCount: comment.replyCount,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: {
      id: comment.author.id,
      firstName: comment.author.firstName,
      lastName: comment.author.lastName,
      name: `${comment.author.firstName} ${comment.author.lastName}`,
      photoUrl: comment.author.photoUrl,
    },
    myReaction,
  };
};

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

const assertPostAccessible = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, visibility: true, authorId: true },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  if (post.visibility === EVisibility.PRIVATE && post.authorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to access this post");
  }

  return post;
};

const createComment = async (payload: CreateCommentInput, authorId: string): Promise<CommentResponse> => {
  const { postId, parentId, content } = payload;

  const post = await assertPostAccessible(postId, authorId);

  let parentAuthorId: string | null = null;

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true, authorId: true },
    });

    if (!parent) {
      throw new ApiError(httpStatus.NOT_FOUND, "Parent comment not found");
    }

    if (parent.postId !== postId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Parent comment does not belong to this post");
    }

    parentAuthorId = parent.authorId;
  }

  const comment = await prisma.$transaction(async tx => {
    const created = await tx.comment.create({
      data: {
        postId,
        parentId: parentId || null,
        content,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    if (parentId) {
      await tx.comment.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    } else {
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
    }

    return created;
  });

  if (post.authorId !== authorId) {
    await NotificationService.createNotification({
      userId: post.authorId,
      actorId: authorId,
      type: ENotificationType.COMMENT_CREATED,
      entityType: ENotificationEntity.COMMENT,
      entityId: comment.id,
      referenceId: postId,
    });
  }

  if (parentAuthorId && parentAuthorId !== authorId && parentAuthorId !== post.authorId) {
    await NotificationService.createNotification({
      userId: parentAuthorId,
      actorId: authorId,
      type: ENotificationType.COMMENT_CREATED,
      entityType: ENotificationEntity.COMMENT,
      entityId: comment.id,
      referenceId: postId,
    });
  }

  return buildCommentResponse(comment);
};

const getCommentsByPost = async (
  postId: string,
  userId: string,
  options: CommentFilterOptions,
): Promise<CommentListResponse> => {
  await assertPostAccessible(postId, userId);

  const limit = options.limit && options.limit > 0 && options.limit <= 50 ? options.limit : DEFAULT_PAGE_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;

  const where: Prisma.CommentWhereInput = {
    postId,
    parentId: null,
    ...(cursor && {
      OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
    }),
  };

  const comments = await prisma.comment.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, -1) : comments;

  const myReactions = await ReactionService.getUserReactionsForEntities(
    "COMMENT",
    items.map(c => c.id),
    userId,
  );

  const data = items.map(comment => buildCommentResponse(comment, myReactions.get(comment.id) || null));
  const nextCursor =
    hasMore && items.length > 0 ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null;

  return { data, meta: { nextCursor } };
};

const getRepliesByComment = async (
  commentId: string,
  userId: string,
  options: CommentFilterOptions,
): Promise<CommentListResponse> => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true },
  });

  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }

  await assertPostAccessible(comment.postId, userId);

  const limit = options.limit && options.limit > 0 && options.limit <= 50 ? options.limit : DEFAULT_PAGE_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;

  const where: Prisma.CommentWhereInput = {
    parentId: commentId,
    ...(cursor && {
      OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }],
    }),
  };

  const replies = await prisma.comment.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });

  const hasMore = replies.length > limit;
  const items = hasMore ? replies.slice(0, -1) : replies;

  const myReactions = await ReactionService.getUserReactionsForEntities(
    "COMMENT",
    items.map(c => c.id),
    userId,
  );

  const data = items.map(reply => buildCommentResponse(reply, myReactions.get(reply.id) || null));
  const nextCursor =
    hasMore && items.length > 0 ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null;

  return { data, meta: { nextCursor } };
};

const updateComment = async (
  commentId: string,
  userId: string,
  payload: UpdateCommentInput,
): Promise<CommentResponse> => {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }

  if (existing.authorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to update this comment");
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content: payload.content },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });

  const myReactions = await ReactionService.getUserReactionsForEntities("COMMENT", [comment.id], userId);

  return buildCommentResponse(comment, myReactions.get(comment.id) || null);
};

const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, parentId: true, postId: true },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }

  if (existing.authorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to delete this comment");
  }

  await prisma.$transaction(async tx => {
    if (existing.parentId) {
      await tx.comment.update({
        where: { id: existing.parentId },
        data: { replyCount: { decrement: 1 } },
      });
    } else {
      await tx.post.update({
        where: { id: existing.postId },
        data: { commentCount: { decrement: 1 } },
      });
    }

    await tx.comment.delete({ where: { id: commentId } });
  });

  await NotificationService.deleteNotificationsByEntity(ENotificationEntity.COMMENT, commentId);
};

export const CommentService = {
  createComment,
  getCommentsByPost,
  getRepliesByComment,
  updateComment,
  deleteComment,
};
