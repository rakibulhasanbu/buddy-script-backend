import { Prisma } from "@prisma/client";
import { GenericErrorResponse } from "@/types/common";

export const handleValidationError = (error: Prisma.PrismaClientValidationError): GenericErrorResponse => {
  const errors = [
    {
      path: "",
      message: error.message,
    },
  ];
  const statusCode = 400;
  return {
    statusCode,
    message: "Validation Error",
    errorMessages: errors,
  };
};
