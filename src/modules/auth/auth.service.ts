import bcryptjs from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "@/config";
import { ApiError } from "@/errors/api-error";
import prisma from "@/lib/prisma";
import { createBcryptPassword } from "@/utils/password";
import { jwtHelpers } from "@/utils/jwt";
import {
  ChangePasswordInput,
  LoginInput,
  LoginResponse,
  RefreshTokenResponse,
  SignupInput,
  UserResponse,
} from "./auth.types";

const buildUserResponse = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse => {
  return {
    ...user,
    name: `${user.firstName} ${user.lastName}`,
  } as UserResponse;
};

const createTokenPair = (userId: string, role: string) => {
  const accessToken = jwtHelpers.createToken(
    { userId, role },
    config.jwt.secret as Secret,
    config.jwt.expires_in as string,
  );
  const refreshToken = jwtHelpers.createToken(
    { userId, role },
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in as string,
  );
  return { accessToken, refreshToken };
};

const signup = async (payload: SignupInput): Promise<LoginResponse> => {
  const { firstName, lastName, email, password } = payload;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, "User already exists");
  }

  const hashedPassword = await createBcryptPassword(password);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: email === config.mainAdminEmail ? "SUPER_ADMIN" : "USER",
      isBlocked: false,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      photoUrl: true,
      coverUrl: true,
      bio: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const { accessToken, refreshToken } = createTokenPair(user.id, user.role);

  return {
    accessToken,
    refreshToken,
    user: buildUserResponse(user),
  };
};

const login = async (payload: LoginInput): Promise<LoginResponse> => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      role: true,
      photoUrl: true,
      coverUrl: true,
      bio: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  if (user.isBlocked) {
    throw new ApiError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (!(await bcryptjs.compare(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  const { accessToken, refreshToken } = createTokenPair(user.id, user.role);

  return {
    accessToken,
    refreshToken,
    user: buildUserResponse({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }),
  };
};

const refreshToken = async (token: string): Promise<RefreshTokenResponse> => {
  let verifiedToken;
  try {
    verifiedToken = jwtHelpers.verifyToken(token, config.jwt.refresh_secret as Secret);
  } catch {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verifiedToken.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      photoUrl: true,
      coverUrl: true,
      bio: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const { accessToken } = createTokenPair(user.id, user.role);

  return {
    accessToken,
    refreshToken: token,
    user: buildUserResponse(user),
  };
};

const changePassword = async (payload: ChangePasswordInput): Promise<LoginResponse> => {
  const { email, oldPassword, newPassword } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      role: true,
      photoUrl: true,
      coverUrl: true,
      bio: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  if (!(await bcryptjs.compare(oldPassword, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Old password is incorrect");
  }

  const hashedPassword = await createBcryptPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      photoUrl: true,
      coverUrl: true,
      bio: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const { accessToken, refreshToken } = createTokenPair(updatedUser.id, updatedUser.role);

  return {
    accessToken,
    refreshToken,
    user: buildUserResponse(updatedUser),
  };
};

export const AuthService = {
  signup,
  login,
  refreshToken,
  changePassword,
};
