import { EReactionEntity, EReactionType } from "@prisma/client";

export type ToggleReactionInput = {
  entityType: EReactionEntity;
  entityId: string;
  type: EReactionType;
};

export type ReactionCounts = Record<string, number>;

export type ReactionFilters = {
  searchTerm?: string;
  type?: string;
};

export type ReactedUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
  type: EReactionType;
  createdAt: Date;
};

export type WhoReactedResponse = {
  data: ReactedUser[];
  meta: { page: number; limit: number; total: number };
};
