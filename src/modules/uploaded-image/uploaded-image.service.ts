import { Prisma, UploadedImage } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { paginationHelpers } from "@/utils/pagination";
import { GenericResponse } from "@/types/common";
import { PaginationOptions } from "@/types/pagination";
import { uploadedImageSearchableFields } from "./uploaded-image.constant";
import { UploadedImageFilters } from "./uploaded-image.types";

const getAllUploadedImage = async (
  filters: UploadedImageFilters,
  paginationOptions: PaginationOptions,
): Promise<GenericResponse<UploadedImage[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(paginationOptions);

  const { searchTerm, ...filterData } = filters;

  const andCondition = [];

  if (searchTerm) {
    const searchAbleFields = uploadedImageSearchableFields.map(single => {
      const query = {
        [single]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      };
      return query;
    });
    andCondition.push({
      OR: searchAbleFields,
    });
  }
  if (Object.keys(filters).length) {
    andCondition.push({
      AND: Object.entries(filterData).map(([field, value]) => {
        // Check if the value is a string "true" or "false"
        if (value === "true" || value === "false") {
          return { [field]: JSON.parse(value) };
        }
        return { [field]: value };
      }),
    });
  }

  const whereConditions: Prisma.UploadedImageWhereInput = andCondition.length > 0 ? { AND: andCondition } : {};

  const result = await prisma.uploadedImage.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      paginationOptions.sortBy && paginationOptions.sortOrder
        ? {
            [paginationOptions.sortBy]: paginationOptions.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });
  const total = await prisma.uploadedImage.count();
  const output = {
    data: result,
    meta: { page, limit, total },
  };
  return output;
};

const createUploadedImage = async (payload: UploadedImage): Promise<UploadedImage | null> => {
  const newUploadedImage = await prisma.uploadedImage.create({
    data: payload,
  });
  return newUploadedImage;
};

const getSingleUploadedImage = async (id: string): Promise<UploadedImage | null> => {
  const result = await prisma.uploadedImage.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateUploadedImage = async (id: string, payload: Partial<UploadedImage>): Promise<UploadedImage | null> => {
  const result = await prisma.uploadedImage.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

const deleteUploadedImage = async (id: string): Promise<UploadedImage | null> => {
  const result = await prisma.uploadedImage.delete({
    where: { id },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "UploadedImage not found!");
  }
  return result;
};

const bulkDeleteUploadedImage = async (ids: string[]): Promise<Prisma.BatchPayload> => {
  const result = await prisma.uploadedImage.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
  return result;
};

export const UploadedImageService = {
  getAllUploadedImage,
  createUploadedImage,
  updateUploadedImage,
  getSingleUploadedImage,
  deleteUploadedImage,
  bulkDeleteUploadedImage,
};
