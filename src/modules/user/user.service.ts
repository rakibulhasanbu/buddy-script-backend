import { EUserRole } from "@prisma/client";
import httpStatus from "http-status";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";

import { PublicUserResponse, UpdateProfileInput, UserResponse } from "./user.types";

const buildUserResponse = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  headline: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse => ({
  ...user,
  role: user.role as EUserRole,
  name: `${user.firstName} ${user.lastName}`,
});

const buildPublicUserResponse = (user: {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  headline: string | null;
  role: string;
  createdAt: Date;
}): PublicUserResponse => ({
  ...user,
  role: user.role as EUserRole,
  name: `${user.firstName} ${user.lastName}`,
});

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  photoUrl: true,
  coverUrl: true,
  bio: true,
  headline: true,
  role: true,
  isBlocked: true,
  createdAt: true,
  updatedAt: true,
};

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  photoUrl: true,
  coverUrl: true,
  bio: true,
  headline: true,
  role: true,
  createdAt: true,
};

const getMe = async (userId: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return buildUserResponse(user);
};

const getUserById = async (targetUserId: string): Promise<PublicUserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return buildPublicUserResponse(user);
};

const updateMe = async (userId: string, payload: UpdateProfileInput): Promise<UserResponse> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.firstName !== undefined && { firstName: payload.firstName }),
      ...(payload.lastName !== undefined && { lastName: payload.lastName }),
      ...(payload.bio !== undefined && { bio: payload.bio }),
      ...(payload.headline !== undefined && { headline: payload.headline }),
      ...(payload.photoUrl !== undefined && { photoUrl: payload.photoUrl }),
      ...(payload.coverUrl !== undefined && { coverUrl: payload.coverUrl }),
    },
    select: userSelect,
  });

  return buildUserResponse(updatedUser);
};

export const UserService = {
  getMe,
  getUserById,
  updateMe,
};
