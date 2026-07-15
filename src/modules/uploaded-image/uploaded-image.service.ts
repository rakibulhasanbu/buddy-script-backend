import { Prisma, UploadedImage } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { paginationHelpers } from "@/utils/pagination";
import { queryBuilder } from "@/utils/query-builder";
import { GenericResponse } from "@/types/common";
import { PaginationOptions } from "@/types/pagination";
import { uploadedImageFilterAbleFields, uploadedImageSearchableFields } from "./uploaded-image.constant";
import { UploadedImageFilters } from "./uploaded-image.types";

const getAllUploadedImage = async (
  filters: UploadedImageFilters,
  paginationOptions: PaginationOptions,
): Promise<GenericResponse<UploadedImage[]>> => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions = queryBuilder.buildWhereClause<Prisma.UploadedImageWhereInput>({
    searchableFields: uploadedImageSearchableFields,
    filterableFields: uploadedImageFilterAbleFields,
    filters: filters as Record<string, unknown>,
  });

  const result = await prisma.uploadedImage.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.uploadedImage.count({ where: whereConditions });

  return { data: result, meta: { page, limit, total } };
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
