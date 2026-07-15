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
    type: z.nativeEnum(EReactionType).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const ReactionValidation = {
  toggleReactionZodSchema,
  whoReactedZodSchema,
};
