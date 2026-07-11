import express from "express";
import auth from "@/middlewares/auth";
import { validateRequest } from "@/middlewares/validate-request";
import { UploadedImageController } from "./uploaded-image.controller";
import { UploadedImageValidation } from "./uploaded-image.validation";

const router = express.Router();

router.get("/", auth("SUPER_ADMIN", "ADMIN", "USER", "EMPLOYEE"), UploadedImageController.getAllUploadedImage);

router.get("/:id", auth("SUPER_ADMIN", "ADMIN", "USER", "EMPLOYEE"), UploadedImageController.getSingleUploadedImage);

router.post(
  "/",
  auth("SUPER_ADMIN", "ADMIN", "USER", "EMPLOYEE"),
  validateRequest(UploadedImageValidation.createValidation),
  UploadedImageController.createUploadedImage,
);

router.patch(
  "/:id",
  auth("SUPER_ADMIN", "ADMIN", "USER", "EMPLOYEE"),
  validateRequest(UploadedImageValidation.updateValidation),
  UploadedImageController.updateUploadedImage,
);

router.delete("/:id", auth("SUPER_ADMIN", "ADMIN", "USER", "EMPLOYEE"), UploadedImageController.deleteUploadedImage);

router.delete(
  "/",
  auth("SUPER_ADMIN", "ADMIN", "USER", "EMPLOYEE"),
  validateRequest(UploadedImageValidation.deleteValidation),
  UploadedImageController.bulkDeleteUploadedImage,
);

export const UploadedImageRoutes = router;
