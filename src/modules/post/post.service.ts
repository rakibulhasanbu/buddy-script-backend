import { EFriendshipStatus, ENotificationEntity, ENotificationType, EVisibility, Post, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { NotificationService } from "@/modules/notification/notification.service";
import { ReactionService } from "@/modules/reaction/reaction.service";
import { ReactionCounts } from "@/modules/reaction/reaction.types";
import { paginationHelpers } from "@/utils/pagination";
import { queryBuilder } from "@/utils/query-builder";
import { PaginationOptions } from "@/types/pagination";
import { CreatePostInput, FeedResponse, PostFilters, PostResponse, UpdatePostInput } from "./post.types";

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

const getFeed = async (
  currentUserId: string,
  filters: PostFilters,
  paginationOptions: PaginationOptions,
): Promise<FeedResponse> => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelpers.calculatePagination(paginationOptions);

  const searchWhere = queryBuilder.buildWhereClause<Prisma.PostWhereInput>({
    searchableFields: ["content"],
    filterableFields: ["visibility", "authorId"],
    filters: filters as Record<string, unknown>,
  });

  const baseWhere: Prisma.PostWhereInput = {
    OR: [{ visibility: EVisibility.PUBLIC }, { authorId: currentUserId }],
  };

  const where: Prisma.PostWhereInput = Object.keys(searchWhere).length > 0
    ? { AND: [baseWhere, searchWhere] }
    : baseWhere;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
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
    }),
    prisma.post.count({ where }),
  ]);

  const myReactions = await ReactionService.getUserReactionsForEntities(
    "POST",
    posts.map(p => p.id),
    currentUserId,
  );

  const data = posts.map(post => buildPostResponse(post, myReactions.get(post.id) || null));

  return { data, meta: { page, limit, total } };
};

const getPostsByUserId = async (
  targetUserId: string,
  currentUserId: string,
  filters: PostFilters,
  paginationOptions: PaginationOptions,
): Promise<FeedResponse> => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelpers.calculatePagination(paginationOptions);

  const searchWhere = queryBuilder.buildWhereClause<Prisma.PostWhereInput>({
    searchableFields: ["content"],
    filterableFields: ["visibility", "authorId"],
    filters: filters as Record<string, unknown>,
  });

  const baseWhere: Prisma.PostWhereInput = {
    authorId: targetUserId,
    OR: [{ visibility: EVisibility.PUBLIC }, { authorId: currentUserId }],
  };

  const where: Prisma.PostWhereInput = Object.keys(searchWhere).length > 0
    ? { AND: [baseWhere, searchWhere] }
    : baseWhere;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
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
    }),
    prisma.post.count({ where }),
  ]);

  const myReactions = await ReactionService.getUserReactionsForEntities(
    "POST",
    posts.map(p => p.id),
    currentUserId,
  );

  const data = posts.map(post => buildPostResponse(post, myReactions.get(post.id) || null));

  return { data, meta: { page, limit, total } };
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
