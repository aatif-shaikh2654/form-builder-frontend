/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Standard API error representation
 */
export interface ApiErrorPayload {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  code?: string;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;
  code?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.statusCode = payload.statusCode;
    this.errors = payload.errors;
    this.code = payload.code;
  }
}
