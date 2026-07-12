import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { ReactionService } from "./reaction.service";
import { WhoReactedResponse } from "./reaction.types";

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
  const { cursor, limit } = req.query;

  const result = await ReactionService.getWhoReacted(
    entityType as "POST" | "COMMENT",
    entityId,
    cursor as string | undefined,
    limit ? Number(limit) : undefined,
  );

  sendResponse<WhoReactedResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reactions fetched successfully",
    data: result,
  });
});

export const ReactionController = {
  toggleReaction,
  getWhoReacted,
};
