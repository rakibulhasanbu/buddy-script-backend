import express from "express";
import { AuthRoutes } from "@/modules/auth/auth.route";
import { CommentRoutes } from "@/modules/comment/comment.route";
import { fileUploadRoutes } from "@/modules/file-upload/file-upload.route";
import { PostRoutes } from "@/modules/post/post.route";
import { ReactionRoutes } from "@/modules/reaction/reaction.route";
import { UserRoutes } from "@/modules/user/user.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/file-upload",
    route: fileUploadRoutes,
  },
  {
    path: "/posts",
    route: PostRoutes,
  },
  {
    path: "/comments",
    route: CommentRoutes,
  },
  {
    path: "/reactions",
    route: ReactionRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
