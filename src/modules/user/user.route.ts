import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";

import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.get("/me", auth("USER", "ADMIN", "SUPER_ADMIN"), UserController.getMe);

router.get("/:id", auth("USER", "ADMIN", "SUPER_ADMIN"), UserController.getUserById);

router.patch(
  "/me",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateMe,
);

export const UserRoutes = router;
