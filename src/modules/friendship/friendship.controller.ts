import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";

import { FriendshipService } from "./friendship.service";
import { FriendshipResponse, FriendUser, SendRequestInput } from "./friendship.types";

const sendRequest: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await FriendshipService.sendRequest(user.userId, req.body as SendRequestInput);

  sendResponse<FriendshipResponse>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Friend request sent successfully",
    data: result,
  });
});

const acceptRequest: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await FriendshipService.acceptRequest(user.userId, req.params.id);

  sendResponse<FriendshipResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Friend request accepted successfully",
    data: result,
  });
});

const declineRequest: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await FriendshipService.declineRequest(user.userId, req.params.id);

  sendResponse<FriendshipResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Friend request declined successfully",
    data: result,
  });
});

const cancelRequest: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await FriendshipService.cancelRequest(user.userId, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Friend request cancelled successfully",
    data: null,
  });
});

const getPendingRequests: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { data } = await FriendshipService.getPendingRequests(user.userId);

  sendResponse<FriendshipResponse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pending requests fetched successfully",
    data,
  });
});

const getFriends: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { data } = await FriendshipService.getFriends(user.userId);

  sendResponse<FriendshipResponse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Friends fetched successfully",
    data,
  });
});

const getSuggestions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { page, limit, sortBy, sortOrder } = req.query;
  const { data, meta } = await FriendshipService.getSuggestions(user.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy: sortBy as string | undefined,
    sortOrder: sortOrder as "asc" | "desc" | undefined,
  });

  sendResponse<FriendUser[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Suggestions fetched successfully",
    data,
    meta,
  });
});

export const FriendshipController = {
  sendRequest,
  acceptRequest,
  declineRequest,
  cancelRequest,
  getPendingRequests,
  getFriends,
  getSuggestions,
};
