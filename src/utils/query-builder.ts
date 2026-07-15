type QueryBuilderInput = {
  searchableFields: string[];
  filterableFields: string[];
  filters: Record<string, unknown>;
};

const buildWhereClause = <T extends Record<string, unknown> = Record<string, unknown>>(input: QueryBuilderInput): T => {
  const { searchableFields, filterableFields, filters } = input;
  const { searchTerm, ...rawFilterData } = filters;

  const activeFilters: Record<string, unknown> = {};
  for (const field of filterableFields) {
    if (rawFilterData[field] !== undefined && rawFilterData[field] !== "") {
      activeFilters[field] = rawFilterData[field];
    }
  }

  const andCondition: unknown[] = [];

  if (searchTerm && searchableFields.length > 0) {
    andCondition.push({
      OR: searchableFields.map(field => ({
        [field]: { contains: searchTerm, mode: "insensitive" as const },
      })),
    });
  }

  if (Object.keys(activeFilters).length > 0) {
    andCondition.push({
      AND: Object.entries(activeFilters).map(([field, value]) => {
        if (value === "true" || value === "false") {
          return { [field]: JSON.parse(value) };
        }
        return { [field]: value };
      }),
    });
  }

  return (andCondition.length > 0 ? { AND: andCondition } : {}) as T;
};

export const queryBuilder = { buildWhereClause };
