import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";

import { NotificationController } from "./notification.controller";
import { NotificationValidation } from "./notification.validation";

const router = express.Router();

router.get(
  "/",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(NotificationValidation.listNotificationsZodSchema),
  NotificationController.getNotifications,
);

router.get("/unread-count", auth("USER", "ADMIN", "SUPER_ADMIN"), NotificationController.getUnreadCount);

router.patch("/mark-all-read", auth("USER", "ADMIN", "SUPER_ADMIN"), NotificationController.markAllAsRead);

router.patch(
  "/:id/read",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(NotificationValidation.groupActionZodSchema),
  NotificationController.markGroupAsRead,
);

router.delete(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(NotificationValidation.groupActionZodSchema),
  NotificationController.deleteGroup,
);

export const NotificationRoutes = router;
