import { z } from "zod";

const createCommentZodSchema = z.object({
  body: z.object({
    postId: z.string({ required_error: "Post id is required" }),
    parentId: z.string().optional(),
    content: z.string({ required_error: "Content is required" }).min(1),
  }),
});

const updateCommentZodSchema = z.object({
  body: z.object({
    content: z.string({ required_error: "Content is required" }).min(1),
  }),
});

const listCommentsZodSchema = z.object({
  params: z.object({
    postId: z.string(),
  }),
  query: z.object({
    searchTerm: z.string().optional(),
    authorId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

const listRepliesZodSchema = z.object({
  params: z.object({
    commentId: z.string(),
  }),
  query: z.object({
    searchTerm: z.string().optional(),
    authorId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const CommentValidation = {
  createCommentZodSchema,
  updateCommentZodSchema,
  listCommentsZodSchema,
  listRepliesZodSchema,
};
