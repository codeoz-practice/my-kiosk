export interface PaginationOptions {
  page?: number; // 페이지 번호(1부터 시작)
  limit?: number; // 페이지 당 항목 수
  sortBy?: string; // 정렬 필드
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}
export interface PaginationResult<T> {
  items: T[];
  meta: PaginationMeta;
}
