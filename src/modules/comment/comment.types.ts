export type CreateCommentInput = {
  postId: string;
  parentId?: string;
  content: string;
};

export type UpdateCommentInput = {
  content: string;
};

export type CommentFilterOptions = {
  cursor?: string;
  limit?: number;
};

export type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
};

export type CommentResponse = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  reactionCounts: Record<string, number>;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthor;
  myReaction: string | null;
};

export type CommentListResponse = {
  data: CommentResponse[];
  meta: {
    nextCursor: string | null;
  };
};
