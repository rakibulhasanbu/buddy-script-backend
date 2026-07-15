import { z } from "zod";

const sendRequestZodSchema = z.object({
  body: z.object({
    addresseeId: z.string().uuid("Addressee ID must be a valid UUID"),
  }),
});

const friendshipActionZodSchema = z.object({
  params: z.object({
    id: z.string().uuid("Friendship ID must be a valid UUID"),
  }),
});

const listFilterZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const FriendshipValidation = {
  sendRequestZodSchema,
  friendshipActionZodSchema,
  listFilterZodSchema,
};
