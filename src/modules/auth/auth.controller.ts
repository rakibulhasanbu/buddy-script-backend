import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import config from "@/config";
import EmailTemplates from "@/services/email.templates";
import sendEmail from "@/services/email.service";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { LoginResponse, RefreshTokenResponse, VerifyTokenResponse } from "./auth.types";
import { AuthService } from "./auth.service";

const cookieOptions = {
  secure: config.env === "production",
  httpOnly: true,
};

const createUser: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const output = await AuthService.createUser(data);
  const { refreshToken, otp, ...result } = output;

  await sendEmail(
    { to: result.user.email },
    {
      subject: EmailTemplates.verify.subject,
      html: EmailTemplates.verify.html({ token: otp }),
    },
  );

  res.cookie("refreshToken", refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "user created successfully!",
    data: { ...result, refreshToken },
  });
});

const resendEmail: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const output = await AuthService.resendEmail(email || "");
  const { refreshToken, otp, ...result } = output;

  await sendEmail(
    { to: result.user.email },
    {
      subject: EmailTemplates.verify.subject,
      html: EmailTemplates.verify.html({ token: otp }),
    },
  );

  res.cookie("refreshToken", refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Otp send successfully",
    data: result,
  });
});

const sendForgotEmail: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const output = await AuthService.sendForgotEmail(email || "");
  const { otp } = output;

  sendResponse<{ otp: number }>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Otp send successfully",
    data: { otp },
  });
});

const sendDeleteUserEmail: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  await AuthService.sendDeleteUserEmail(email || "");

  sendResponse<{ isOtpSend: boolean }>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Otp send successfully",
    data: { isOtpSend: true },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const loginInfo = req.body;
  const result = await AuthService.loginUser(loginInfo);

  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged successfully !",
    data: result,
  });
});

const googleLoginUser = catchAsync(async (req: Request, res: Response) => {
  const loginInfo = req.body;
  const result = await AuthService.googleLoginUser(loginInfo);

  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged successfully !",
    data: result,
  });
});

const verifyOtpForAdminLogin = catchAsync(async (req: Request, res: Response) => {
  const loginInfo = req.body;
  const result = await AuthService.verifyOtpForAdminLogin(loginInfo);

  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged successfully !",
    data: result,
  });
});

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
  const loginInfo = req.body;
  const result = await AuthService.loginAdmin(loginInfo);

  sendResponse<{ otp: string }>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "otp send successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await AuthService.refreshToken(refreshToken);

  sendResponse<RefreshTokenResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New access token generated successfully !",
    data: result,
  });
});

const verifySignupToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = req.user as JwtPayload;

  const result = await AuthService.verifySignupToken(token, user.userId);
  res.cookie("refreshToken", result.refreshToken, cookieOptions);

  sendResponse<VerifyTokenResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token verify successfully",
    data: result,
  });
});

const verifyForgotToken = catchAsync(async (req: Request, res: Response) => {
  const { token, email } = req.body;
  const result = await AuthService.verifyForgotToken(token, email);

  sendResponse<{ token: number; isValidate: boolean }>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token verify successfully",
    data: result,
  });
});

const verifyDeleteUserToken = catchAsync(async (req: Request, res: Response) => {
  const { token, email } = req.body;
  const result = await AuthService.verifyDeleteUserToken(token, email);

  sendResponse<{ token: number; isValidate: boolean; deletedUserId: string }>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token verify successfully",
    data: result,
  });
});

const changePassword: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const output = await AuthService.changePassword(data);
  const { refreshToken, ...result } = output;

  res.cookie("refreshToken", refreshToken, cookieOptions);
  sendResponse<LoginResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "password change successfully!",
    data: result,
  });
});

export const AuthController = {
  createUser,
  loginUser,
  refreshToken,
  verifySignupToken,
  resendEmail,
  sendForgotEmail,
  verifyForgotToken,
  changePassword,
  sendDeleteUserEmail,
  verifyDeleteUserToken,
  loginAdmin,
  verifyOtpForAdminLogin,
  googleLoginUser,
};
