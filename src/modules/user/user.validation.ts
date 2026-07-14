import { z } from "zod";

const updateProfileZodSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long").optional(),
    lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long").optional(),
    bio: z.string().trim().max(500, "Bio must be 500 characters or less").optional(),
    photoUrl: z.string().trim().url("Photo URL must be a valid URL").optional(),
    coverUrl: z.string().trim().url("Cover URL must be a valid URL").optional(),
  }),
});

export const UserValidation = {
  updateProfileZodSchema,
};
