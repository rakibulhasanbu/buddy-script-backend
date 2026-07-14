import axios from "axios";
import { NextFunction, Request, Response } from "express";
import FormData from "form-data";
import fs from "fs";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import config from "@/config";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";

export const uploadImageFile = catchAsync(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No image found!");
    }

    const form = new FormData();
    form.append("image", fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype, // important!
    });

    // Copy query parameters
    // eslint-disable-next-line no-undef
    const query = new URLSearchParams(req.query as Record<string, string>).toString();

    const { data } = await axios.post(`${config.mediaServerUrl}?${query}`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Delete temp file
    fs.unlink(req.file.path, () => null);
    const user = req.user as JwtPayload;
    const id = user.userId;
    await prisma.uploadedImage.create({
      data: {
        url: data.data.url,
        userId: id,
      },
    });

    sendResponse(res, {
      statusCode: data.statusCode,
      success: data.success,
      message: data.message,
      data: data.data,
    });
    //  res.status(httpStatus.OK).json(data);
  },
);

export const uploadDocumentFile = (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No document found");
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploadedFiles/bookFile/${req.file.filename}`;
  res.status(httpStatus.OK).json({ message: "Document uploaded successfully!", fileUrl });
};
