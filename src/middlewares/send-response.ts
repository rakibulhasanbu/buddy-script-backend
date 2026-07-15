import { Response } from "express";
import { IMeta } from "@/types/common";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string | null;
  meta?: IMeta;
  data?: T | null;
  token?: string | null;
};

export const sendResponse = <T>(res: Response, data: ApiResponse<T>): void => {
  const responseData: ApiResponse<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || null,
    meta: data.meta || null || undefined,
    data: data.data || null || undefined,
  };

  res.status(data.statusCode).json(responseData);
};
