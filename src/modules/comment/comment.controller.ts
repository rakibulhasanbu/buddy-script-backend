import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { CommentService } from "./comment.service";
import { CommentResponse } from "./comment.types";

const createComment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await CommentService.createComment(req.body, user.userId);

  sendResponse<CommentResponse>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Comment created successfully",
    data: result,
  });
});

const getCommentsByPost: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { cursor, limit } = req.query;

  const { data, meta } = await CommentService.getCommentsByPost(req.params.postId, user.userId, {
    cursor: cursor as string | undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendResponse<CommentResponse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments fetched successfully",
    data,
    meta,
  });
});

const getRepliesByComment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { cursor, limit } = req.query;

  const { data, meta } = await CommentService.getRepliesByComment(req.params.commentId, user.userId, {
    cursor: cursor as string | undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendResponse<CommentResponse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Replies fetched successfully",
    data,
    meta,
  });
});

const updateComment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await CommentService.updateComment(req.params.id, user.userId, req.body);

  sendResponse<CommentResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment updated successfully",
    data: result,
  });
});

const deleteComment: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await CommentService.deleteComment(req.params.id, user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment deleted successfully",
    data: null,
  });
});

export const CommentController = {
  createComment,
  getCommentsByPost,
  getRepliesByComment,
  updateComment,
  deleteComment,
};
