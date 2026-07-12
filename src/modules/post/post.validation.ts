import { EVisibility } from "@prisma/client";
import { z } from "zod";

const createPostZodSchema = z.object({
  body: z.object({
    content: z.string({ required_error: "Content is required" }).min(1),
    imageUrl: z.string().optional(),
    visibility: z.enum([EVisibility.PUBLIC, EVisibility.PRIVATE]).default(EVisibility.PUBLIC),
  }),
});

const updatePostZodSchema = z.object({
  body: z.object({
    content: z.string().min(1).optional(),
    imageUrl: z.string().optional(),
    visibility: z.enum([EVisibility.PUBLIC, EVisibility.PRIVATE]).optional(),
  }),
});

const postFilterZodSchema = z.object({
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

export const PostValidation = {
  createPostZodSchema,
  updatePostZodSchema,
  postFilterZodSchema,
};
