import { GenericErrorMessage } from "./error";

export type IMeta = {
  page?: number;
  limit?: number;
  total?: number;
  nextCursor?: string | null;
};

export type GenericResponse<T> = {
  meta: IMeta;
  data: T;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta?: IMeta;
  success: boolean;
  message: string;
  statusCode: number;
};

export type GenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: GenericErrorMessage[];
};
