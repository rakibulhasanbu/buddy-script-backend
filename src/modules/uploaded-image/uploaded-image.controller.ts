import { Prisma, UploadedImage } from "@prisma/client";
import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { paginationFields } from "@/constants/pagination";
import { catchAsync } from "@/middlewares/catch-async";
import { pick } from "@/utils/pick";
import { sendResponse } from "@/middlewares/send-response";
import { uploadedImageFilterAbleFields } from "./uploaded-image.constant";
import { UploadedImageService } from "./uploaded-image.service";
const createUploadedImage: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const UploadedImageData = req.body;

  const result = await UploadedImageService.createUploadedImage(UploadedImageData);
  sendResponse<UploadedImage>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UploadedImage Created successfully!",
    data: result,
  });
});

const getAllUploadedImage = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", ...uploadedImageFilterAbleFields]);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await UploadedImageService.getAllUploadedImage(filters, paginationOptions);

  sendResponse<UploadedImage[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UploadedImage retrieved successfully !",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleUploadedImage: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await UploadedImageService.getSingleUploadedImage(id);

  sendResponse<UploadedImage>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UploadedImage retrieved  successfully!",
    data: result,
  });
});

const updateUploadedImage: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const updateAbleData = req.body;

  const result = await UploadedImageService.updateUploadedImage(id, updateAbleData);

  sendResponse<UploadedImage>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UploadedImage Updated successfully!",
    data: result,
  });
});
const deleteUploadedImage: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await UploadedImageService.deleteUploadedImage(id);

  sendResponse<UploadedImage>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UploadedImage deleted successfully!",
    data: result,
  });
});
const bulkDeleteUploadedImage: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const ids = req.body;

  const result = await UploadedImageService.bulkDeleteUploadedImage(ids);

  sendResponse<Prisma.BatchPayload>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UploadedImage deleted successfully!",
    data: result,
  });
});

export const UploadedImageController = {
  getAllUploadedImage,
  createUploadedImage,
  updateUploadedImage,
  getSingleUploadedImage,
  deleteUploadedImage,
  bulkDeleteUploadedImage,
};
