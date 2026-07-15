import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";

import { FriendshipController } from "./friendship.controller";
import { FriendshipValidation } from "./friendship.validation";

const router = express.Router();

router.post(
  "/request",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.sendRequestZodSchema),
  FriendshipController.sendRequest,
);

router.patch(
  "/:id/accept",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.friendshipActionZodSchema),
  FriendshipController.acceptRequest,
);

router.patch(
  "/:id/decline",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.friendshipActionZodSchema),
  FriendshipController.declineRequest,
);

router.delete(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.friendshipActionZodSchema),
  FriendshipController.cancelRequest,
);

router.get(
  "/pending",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.listFilterZodSchema),
  FriendshipController.getPendingRequests,
);

router.get(
  "/friends",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.listFilterZodSchema),
  FriendshipController.getFriends,
);

router.get(
  "/suggestions",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(FriendshipValidation.listFilterZodSchema),
  FriendshipController.getSuggestions,
);

export const FriendshipRoutes = router;
