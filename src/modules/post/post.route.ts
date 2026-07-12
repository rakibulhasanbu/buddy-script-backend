import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";

const router = express.Router();

router.post(
  "/",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(PostValidation.createPostZodSchema),
  PostController.createPost,
);

router.get(
  "/",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(PostValidation.postFilterZodSchema),
  PostController.getFeed,
);

router.get("/:id", auth("USER", "ADMIN", "SUPER_ADMIN"), PostController.getPostById);

router.patch(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(PostValidation.updatePostZodSchema),
  PostController.updatePost,
);

router.delete("/:id", auth("USER", "ADMIN", "SUPER_ADMIN"), PostController.deletePost);

export const PostRoutes = router;
