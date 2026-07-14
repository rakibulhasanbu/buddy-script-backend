import { Request, Response, RequestHandler } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "@/middlewares/catch-async";
import { sendResponse } from "@/middlewares/send-response";
import { PostService } from "./post.service";
import { FeedResponse, PostResponse, UserPostsResponse } from "./post.types";

const createPost: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PostService.createPost(req.body, user.userId);

  sendResponse<PostResponse>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created successfully",
    data: result,
  });
});

const getFeed: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { cursor, limit } = req.query;

  const result = await PostService.getFeed(user.userId, {
    cursor: cursor as string | undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendResponse<FeedResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Feed fetched successfully",
    data: result,
  });
});

const getPostsByUser: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { cursor, limit } = req.query;

  const result = await PostService.getPostsByUserId(req.params.id, user.userId, {
    cursor: cursor as string | undefined,
    limit: limit ? Number(limit) : undefined,
  });

  sendResponse<UserPostsResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User posts fetched successfully",
    data: result,
  });
});

const getPostById: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PostService.getPostById(req.params.id, user.userId);

  sendResponse<PostResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post fetched successfully",
    data: result,
  });
});

const updatePost: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PostService.updatePost(req.params.id, user.userId, req.body);

  sendResponse<PostResponse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post updated successfully",
    data: result,
  });
});

const deletePost: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  await PostService.deletePost(req.params.id, user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post deleted successfully",
    data: null,
  });
});

export const PostController = {
  createPost,
  getFeed,
  getPostsByUser,
  getPostById,
  updatePost,
  deletePost,
};
