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
    searchTerm: z.string().optional(),
    visibility: z.enum([EVisibility.PUBLIC, EVisibility.PRIVATE]).optional(),
    authorId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const PostValidation = {
  createPostZodSchema,
  updatePostZodSchema,
  postFilterZodSchema,
};
