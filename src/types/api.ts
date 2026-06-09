export interface SearchParams {
  query?: string;
  genre?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
}
