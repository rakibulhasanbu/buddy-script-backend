import { EFriendshipStatus, ENotificationEntity, ENotificationType, EVisibility, Post, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { NotificationService } from "@/modules/notification/notification.service";
import { ReactionService } from "@/modules/reaction/reaction.service";
import { ReactionCounts } from "@/modules/reaction/reaction.types";
import { CreatePostInput, FeedResponse, PostFilterOptions, PostResponse, UpdatePostInput } from "./post.types";

const DEFAULT_PAGE_LIMIT = 10;

type PostWithAuthor = Post & {
  author: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
};

const buildPostResponse = (post: PostWithAuthor, myReaction: string | null = null): PostResponse => {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    visibility: post.visibility,
    reactionCounts: (post.reactionCounts as ReactionCounts) || {},
    commentCount: post.commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: post.author.id,
      firstName: post.author.firstName,
      lastName: post.author.lastName,
      name: `${post.author.firstName} ${post.author.lastName}`,
      photoUrl: post.author.photoUrl,
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

const createPost = async (payload: CreatePostInput, authorId: string): Promise<PostResponse> => {
  const post = await prisma.post.create({
    data: {
      content: payload.content,
      imageUrl: payload.imageUrl,
      visibility: payload.visibility || EVisibility.PUBLIC,
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

  if (post.visibility === EVisibility.PUBLIC) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: EFriendshipStatus.ACCEPTED,
        OR: [{ requesterId: authorId }, { addresseeId: authorId }],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    });

    const friendIds = friendships.map(friendship =>
      friendship.requesterId === authorId ? friendship.addresseeId : friendship.requesterId,
    );

    const uniqueFriendIds = [...new Set(friendIds)];

    if (uniqueFriendIds.length > 0) {
      await NotificationService.createBulkNotifications(
        uniqueFriendIds.map(friendId => ({
          userId: friendId,
          actorId: authorId,
          type: ENotificationType.POST_CREATED,
          entityType: ENotificationEntity.POST,
          entityId: post.id,
        })),
      );
    }
  }

  return buildPostResponse(post);
};

const getFeed = async (currentUserId: string, options: PostFilterOptions): Promise<FeedResponse> => {
  const limit = options.limit && options.limit > 0 && options.limit <= 50 ? options.limit : DEFAULT_PAGE_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;

  const where: Prisma.PostWhereInput = {
    OR: [{ visibility: EVisibility.PUBLIC }, { authorId: currentUserId }],
    ...(cursor && {
      OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
    }),
  };

  const posts = await prisma.post.findMany({
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

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;

  const myReactions = await ReactionService.getUserReactionsForEntities(
    "POST",
    items.map(p => p.id),
    currentUserId,
  );

  const data = items.map(post => buildPostResponse(post, myReactions.get(post.id) || null));
  const nextCursor =
    hasMore && items.length > 0 ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null;

  return { data, meta: { nextCursor } };
};

const getPostsByUserId = async (
  targetUserId: string,
  currentUserId: string,
  options: PostFilterOptions,
): Promise<FeedResponse> => {
  const limit = options.limit && options.limit > 0 && options.limit <= 50 ? options.limit : DEFAULT_PAGE_LIMIT;
  const cursor = options.cursor ? decodeCursor(options.cursor) : undefined;

  const where: Prisma.PostWhereInput = {
    authorId: targetUserId,
    OR: [{ visibility: EVisibility.PUBLIC }, { authorId: currentUserId }],
    ...(cursor && {
      OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }],
    }),
  };

  const posts = await prisma.post.findMany({
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

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;

  const myReactions = await ReactionService.getUserReactionsForEntities(
    "POST",
    items.map(p => p.id),
    currentUserId,
  );

  const data = items.map(post => buildPostResponse(post, myReactions.get(post.id) || null));
  const nextCursor =
    hasMore && items.length > 0 ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null;

  return { data, meta: { nextCursor } };
};

const getPostById = async (postId: string, currentUserId: string): Promise<PostResponse> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
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

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  if (post.visibility === EVisibility.PRIVATE && post.authorId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to view this post");
  }

  const myReactions = await ReactionService.getUserReactionsForEntities("POST", [post.id], currentUserId);

  return buildPostResponse(post, myReactions.get(post.id) || null);
};

const updatePost = async (postId: string, currentUserId: string, payload: UpdatePostInput): Promise<PostResponse> => {
  const existing = await prisma.post.findUnique({ where: { id: postId } });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  if (existing.authorId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to update this post");
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(payload.content !== undefined && { content: payload.content }),
      ...(payload.imageUrl !== undefined && { imageUrl: payload.imageUrl }),
      ...(payload.visibility !== undefined && { visibility: payload.visibility }),
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

  const myReactions = await ReactionService.getUserReactionsForEntities("POST", [post.id], currentUserId);

  return buildPostResponse(post, myReactions.get(post.id) || null);
};

const deletePost = async (postId: string, currentUserId: string): Promise<void> => {
  const existing = await prisma.post.findUnique({ where: { id: postId } });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  if (existing.authorId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to delete this post");
  }

  await NotificationService.deleteNotificationsByEntity(ENotificationEntity.POST, postId);
  await prisma.post.delete({ where: { id: postId } });
};

export const PostService = {
  createPost,
  getFeed,
  getPostsByUserId,
  getPostById,
  updatePost,
  deletePost,
};
