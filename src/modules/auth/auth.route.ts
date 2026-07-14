import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post("/signup", validateRequest(AuthValidation.signupZodSchema), AuthController.signup);

router.post("/signin", validateRequest(AuthValidation.loginZodSchema), AuthController.login);

router.post("/refresh-token", validateRequest(AuthValidation.refreshTokenZodSchema), AuthController.refreshToken);

router.post(
  "/change-password",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.changePassword,
);

export const AuthRoutes = router;
