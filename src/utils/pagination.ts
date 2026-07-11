type PaginationInput = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

type PaginationResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
};

const calculatePagination = (options: PaginationInput): PaginationResult => {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(Number(options.limit) || 10, 500));
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelpers = {
  calculatePagination,
};
