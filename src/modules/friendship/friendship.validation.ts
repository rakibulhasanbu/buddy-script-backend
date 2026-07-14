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

export const FriendshipValidation = {
  sendRequestZodSchema,
  friendshipActionZodSchema,
};
