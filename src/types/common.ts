import { GenericErrorMessage } from "./error";

export type GenericResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: T;
};

export type GenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: GenericErrorMessage[];
};
