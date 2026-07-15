import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "@/constants/pagination";
import { catchAsync } from "@/middlewares/catch-async";
import { pick } from "@/utils/pick";
import { sendResponse } from "@/middlewares/send-response";
import { reactionFilterAbleFields } from "./reaction.constant";
import { ReactionService } from "./reaction.service";
import { ReactedUser } from "./reaction.types";

const toggleReaction: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await ReactionService.toggleReaction(req.body, user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Reaction ${result.action}`,
    data: result,
  });
});

const getWhoReacted: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const filters = pick(req.query, ["searchTerm", ...reactionFilterAbleFields]);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await ReactionService.getWhoReacted(
    entityType as "POST" | "COMMENT",
    entityId,
    filters,
    paginationOptions,
  );

  sendResponse<ReactedUser[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reactions fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const ReactionController = {
  toggleReaction,
  getWhoReacted,
};
