import { EVisibility } from "@prisma/client";

export type CreatePostInput = {
  content: string;
  imageUrl?: string;
  visibility?: EVisibility;
};

export type UpdatePostInput = {
  content?: string;
  imageUrl?: string;
  visibility?: EVisibility;
};

export type PostFilterOptions = {
  cursor?: string;
  limit?: number;
};

export type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
};

export type PostResponse = {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: EVisibility;
  reactionCounts: Record<string, number>;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: PostAuthor;
  myReaction: string | null;
};

export type FeedResponse = {
  data: PostResponse[];
  meta: {
    nextCursor: string | null;
  };
};
