import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { pick } from "@/utils/pick";

import { notificationFilterAbleFields } from "./notification.constant";
import { NotificationService } from "./notification.service";
import { NotificationGroup, UnreadCountResponse } from "./notification.types";

const getNotifications: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const filters = pick(req.query, ["searchTerm", ...notificationFilterAbleFields]);
  const paginationOptions = pick(req.query, ["cursor", "limit"]);

  const { data, meta } = await NotificationService.getGroupedNotifications(user.userId, filters, paginationOptions);

  sendResponse<NotificationGroup[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications fetched successfully",
    data,
    meta,
  });
});

const getUnreadCount: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await NotificationService.getUnreadCount(user.userId);

  sendResponse<UnreadCountResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread count fetched successfully",
    data: result,
  });
});

const markGroupAsRead: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await NotificationService.markGroupAsRead(user.userId, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification marked as read",
    data: null,
  });
});

const markAllAsRead: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await NotificationService.markAllAsRead(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All notifications marked as read",
    data: null,
  });
});

const deleteGroup: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await NotificationService.deleteGroup(user.userId, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification deleted successfully",
    data: null,
  });
});

export const NotificationController = {
  getNotifications,
  getUnreadCount,
  markGroupAsRead,
  markAllAsRead,
  deleteGroup,
};
