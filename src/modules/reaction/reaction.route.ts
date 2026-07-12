import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";
import { ReactionController } from "./reaction.controller";
import { ReactionValidation } from "./reaction.validation";

const router = express.Router();

router.post(
  "/toggle",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(ReactionValidation.toggleReactionZodSchema),
  ReactionController.toggleReaction,
);

router.get(
  "/:entityType/:entityId",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(ReactionValidation.whoReactedZodSchema),
  ReactionController.getWhoReacted,
);

export const ReactionRoutes = router;
