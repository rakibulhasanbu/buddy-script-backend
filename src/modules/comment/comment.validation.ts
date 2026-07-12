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
    cursor: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? Number(val) : undefined))
      .refine(val => val === undefined || (val > 0 && val <= 50), {
        message: "Limit must be between 1 and 50",
      }),
  }),
});

const listRepliesZodSchema = z.object({
  params: z.object({
    commentId: z.string(),
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? Number(val) : undefined))
      .refine(val => val === undefined || (val > 0 && val <= 50), {
        message: "Limit must be between 1 and 50",
      }),
  }),
});

export const CommentValidation = {
  createCommentZodSchema,
  updateCommentZodSchema,
  listCommentsZodSchema,
  listRepliesZodSchema,
};
