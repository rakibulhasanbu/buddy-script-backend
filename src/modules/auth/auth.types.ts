import { EUserRole, User } from "@prisma/client";

export type JwtPayload = {
  userId: string;
  role: EUserRole;
};

export type UserResponse = Omit<User, "password"> & {
  name: string;
};

export type PublicUserResponse = Omit<UserResponse, "email" | "isBlocked" | "updatedAt">;

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type ChangePasswordInput = {
  email: string;
  oldPassword: string;
  newPassword: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};
