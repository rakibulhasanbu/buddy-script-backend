import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import config from "@/config";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { AuthService } from "./auth.service";
import { LoginResponse, RefreshTokenResponse } from "./auth.types";

const cookieOptions = {
  secure: config.env === "production",
  httpOnly: true,
};

const signup: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signup(req.body);

  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const login: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const refreshToken: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.refreshToken(refreshToken);

  sendResponse<RefreshTokenResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully",
    data: result,
  });
});

const changePassword: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.changePassword(req.body);

  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

export const AuthController = {
  signup,
  login,
  refreshToken,
  changePassword,
};
