import { EUserRole } from "@prisma/client";

export type UserResponse = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  photoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  role: EUserRole;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUserResponse = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  role: EUserRole;
  createdAt: Date;
};

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  photoUrl?: string;
  coverUrl?: string;
};
