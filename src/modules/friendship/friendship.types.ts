import { EFriendshipStatus } from "@prisma/client";

export type FriendUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
  headline: string | null;
};

export type FriendshipResponse = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: EFriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  requester: FriendUser;
  addressee: FriendUser;
};

export type SendRequestInput = {
  addresseeId: string;
};

export type FriendListResponse = {
  data: FriendshipResponse[];
};

export type SuggestionListResponse = {
  data: FriendUser[];
  meta: { page: number; limit: number; total: number };
};
