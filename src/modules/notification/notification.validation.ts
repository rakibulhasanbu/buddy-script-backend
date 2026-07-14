import { z } from "zod";

const listNotificationsZodSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    unreadOnly: z.enum(["true", "false"]).optional(),
  }),
});

const groupActionZodSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Group ID is required"),
  }),
});

export const NotificationValidation = {
  listNotificationsZodSchema,
  groupActionZodSchema,
};
