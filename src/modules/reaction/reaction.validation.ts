import { EReactionEntity, EReactionType } from "@prisma/client";
import { z } from "zod";

const toggleReactionZodSchema = z.object({
  body: z.object({
    entityType: z.nativeEnum(EReactionEntity),
    entityId: z.string({ required_error: "Entity id is required" }),
    type: z.nativeEnum(EReactionType),
  }),
});

const whoReactedZodSchema = z.object({
  params: z.object({
    entityType: z.nativeEnum(EReactionEntity),
    entityId: z.string(),
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

export const ReactionValidation = {
  toggleReactionZodSchema,
  whoReactedZodSchema,
};
