import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "@/constants/pagination";
import { pick } from "@/utils/pick";

import { friendFilterAbleFields, friendshipFilterAbleFields, suggestionFilterAbleFields } from "./friendship.constant";
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
  const filters = pick(req.query, ["searchTerm", ...friendshipFilterAbleFields]);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await FriendshipService.getPendingRequests(user.userId, filters, paginationOptions);

  sendResponse<FriendshipResponse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pending requests fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getFriends: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const filters = pick(req.query, ["searchTerm", ...friendFilterAbleFields]);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await FriendshipService.getFriends(user.userId, filters, paginationOptions);

  sendResponse<FriendshipResponse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Friends fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSuggestions: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const filters = pick(req.query, ["searchTerm", ...suggestionFilterAbleFields]);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await FriendshipService.getSuggestions(user.userId, filters, paginationOptions);

  sendResponse<FriendUser[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Suggestions fetched successfully",
    data: result.data,
    meta: result.meta,
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
