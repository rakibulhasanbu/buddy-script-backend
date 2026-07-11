import express from "express";
import { AuthRoutes } from "@/modules/auth/auth.route";
import { fileUploadRoutes } from "@/modules/file-upload/file-upload.route";
import { UploadedImageRoutes } from "@/modules/uploaded-image/uploaded-image.route";

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
    path: "/uploaded-images",
    route: UploadedImageRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
