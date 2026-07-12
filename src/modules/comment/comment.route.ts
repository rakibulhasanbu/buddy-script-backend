import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";
import { CommentController } from "./comment.controller";
import { CommentValidation } from "./comment.validation";

const router = express.Router();

router.post(
  "/",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(CommentValidation.createCommentZodSchema),
  CommentController.createComment,
);

router.get(
  "/post/:postId",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(CommentValidation.listCommentsZodSchema),
  CommentController.getCommentsByPost,
);

router.get(
  "/:commentId/replies",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(CommentValidation.listRepliesZodSchema),
  CommentController.getRepliesByComment,
);

router.patch(
  "/:id",
  auth("USER", "ADMIN", "SUPER_ADMIN"),
  validateRequest(CommentValidation.updateCommentZodSchema),
  CommentController.updateComment,
);

router.delete("/:id", auth("USER", "ADMIN", "SUPER_ADMIN"), CommentController.deleteComment);

export const CommentRoutes = router;
