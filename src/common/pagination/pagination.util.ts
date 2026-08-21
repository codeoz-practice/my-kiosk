import { PaginationMeta, PaginationOptions } from './pagination.types';

export class PaginationUtil {
  static createMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };
  }

  static normalize(options: PaginationOptions): Required<PaginationOptions> {
    return {
      page: options.page ?? 1,
      limit: options.limit ?? 10,
      sortBy: options.sortBy ?? 'createdAt',
      sortOrder: options.sortOrder ?? 'desc',
    };
  }
}
