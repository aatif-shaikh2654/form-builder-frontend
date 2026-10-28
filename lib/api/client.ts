import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { toast } from 'sonner';
import { ApiError } from './types';
import { SESSION_TOKEN_STORAGE_KEY } from '@/features/user/constants/user.constants';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

export interface RequestConfig extends AxiosRequestConfig {
  skipErrorToast?: boolean;
}

// Default backend API URL (FastAPI standard endpoint)
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'http://localhost:8000/api/v1';

/**
 * Single unified Axios instance used across both client and service layers.
 * Configured with credentials enabled so auth cookies are automatically sent with all requests.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Request interceptor:
// Automatically attach x-session-token from localStorage if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
    if (sessionToken) {
      config.headers = config.headers || {};
      config.headers[SESSION_TOKEN_STORAGE_KEY] = sessionToken;
    }
  }
  return config;
});

// Helper with deduplication & throttle to guarantee a single toast per error
let lastErrorToastMessage = '';
let lastErrorToastTime = 0;

export const showApiErrorToast = (message: string) => {
  if (typeof window === 'undefined' || !message) return;
  const now = Date.now();
  // If the identical message was toasted in the last 2000ms, skip duplicate
  if (message === lastErrorToastMessage && now - lastErrorToastTime < 2000) {
    return;
  }
  lastErrorToastMessage = message;
  lastErrorToastTime = now;
  toast.error(message, { id: message });
};

// Response interceptor:
// 1. Validates backend response wrapper (handling !response.success)
// 2. Automatically unwraps nested response.data
// 3. Centralizes error toasts for both failed business logic and HTTP errors (unless skipErrorToast is true)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;
    const skipErrorToast = Boolean(response.config?.skipErrorToast);

    if (body && typeof body === 'object') {
      // Handle business logic failures: { success: false, message: '...' }
      if ('success' in body && !body.success) {
        const errorMsg =
          (body as { message?: string }).message ||
          'Operation failed';

        if (!skipErrorToast) {
          showApiErrorToast(errorMsg);
        }

        return Promise.reject(
          new ApiError({
            message: errorMsg,
            statusCode: response.status || 400,
          })
        );
      }

      // Automatically unwrap the data field so callers directly receive the payload
      if ('data' in body) {
        response.data = body.data;
      }
    }

    return response;
  },
  (error) => {
    const config = error?.config as AxiosRequestConfig | undefined;
    const skipErrorToast = Boolean(config?.skipErrorToast);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const data = error.response?.data as
        | { detail?: string | unknown[]; message?: string; errors?: Record<string, string[]>; code?: string }
        | undefined;

      const rawMessage =
        data?.detail ||
        data?.message ||
        (typeof data === 'string' ? data : null) ||
        error.message ||
        'An unexpected network error occurred';

      let errorMessage = 'An unexpected network error occurred';
      if (typeof rawMessage === 'string') {
        errorMessage = rawMessage;
      } else if (Array.isArray(rawMessage)) {
        errorMessage = rawMessage
          .map((item: unknown) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              const record = item as Record<string, unknown>;
              return String(record.msg || record.message || JSON.stringify(item));
            }
            return String(item);
          })
          .join('; ');
      } else if (rawMessage && typeof rawMessage === 'object') {
        const record = rawMessage as Record<string, unknown>;
        errorMessage = String(
          record.message ||
          record.msg ||
          JSON.stringify(rawMessage)
        );
      }

      // Automatically display toast error centrally in the Axios instance unless skipped
      if (!skipErrorToast) {
        showApiErrorToast(errorMessage);
      }

      if (status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      return Promise.reject(
        new ApiError({
          message: errorMessage,
          statusCode: status,
          errors: data?.errors,
          code: data?.code || error.code,
        })
      );
    }

    if (!skipErrorToast) {
      const fallbackMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      showApiErrorToast(fallbackMsg);
    }

    return Promise.reject(error);
  }
);

/**
 * Generic helper methods for HTTP requests
 */
export const clientHttp = {
  get: <T = unknown>(url: string, config?: RequestConfig): Promise<T> =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T = unknown>(url: string, config?: RequestConfig): Promise<T> =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

// Unified aliases ensuring seamless usage across client and service layers without duplicate instances
export const serverHttp = clientHttp;
export const http = clientHttp;
