import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";

import { UserService } from "./user.service";
import { PublicUserResponse, UpdateProfileInput, UserResponse } from "./user.types";

const getMe: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await UserService.getMe(user.userId);

  sendResponse<UserResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const getUserById: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserById(req.params.id);

  sendResponse<PublicUserResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateMe: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await UserService.updateMe(user.userId, req.body as UpdateProfileInput);

  sendResponse<UserResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

export const UserController = {
  getMe,
  getUserById,
  updateMe,
};
