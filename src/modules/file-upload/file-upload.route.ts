import express from "express";
import multer from "multer";
import auth from "@/middlewares/auth";
import { uploadDoc } from "@/middlewares/upload-image";
import { uploadDocumentFile, uploadImageFile } from "./file-upload.controller";
const upload = multer({ dest: "temp/" }); // Temporary storage

const router = express.Router();

// Upload Image
router.post("/upload-image", auth("ADMIN", "SUPER_ADMIN", "USER"), upload.single("image"), uploadImageFile);

// Upload Document (Doc, PDF)
router.post("/upload-doc", auth("ADMIN", "SUPER_ADMIN", "USER"), uploadDoc.single("document"), uploadDocumentFile);

export const fileUploadRoutes = router;
