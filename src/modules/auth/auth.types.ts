import { EUserRole, User } from "@prisma/client";

export type JwtPayload = {
  userId: string;
  role: EUserRole;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "password">;
};

export type VerifyTokenResponse = {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, "password">;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type GoogleLoginInput = {
  email: string;
  name?: string;
  photoUrl?: string;
  gId: string;
};

export type AdminLoginInput = {
  email: string;
  password: string;
  otp: number;
};

export type LoginResponse = {
  accessToken: string;
  user: Omit<User, "password">;
  refreshToken?: string;
  otp?: number;
};
