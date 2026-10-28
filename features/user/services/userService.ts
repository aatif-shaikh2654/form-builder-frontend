import { clientHttp } from '@/lib/api';
import type {
  UserResponse,
  LoginPayload,
  SignupPayload,
  RefreshTokenPayload,
  SessionData,
  APIResponse,
} from '@/types/api.types';
import { SESSION_TOKEN_STORAGE_KEY } from '../constants/user.constants';

export const userService = {
  /**
   * GET /api/v1/auth/session - Fetch session status & guest session token
   */
  getSession(): Promise<SessionData> {
    return clientHttp.get<SessionData>('/auth/session', { skipErrorToast: true });
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(payload: LoginPayload): Promise<{ success: boolean; message: string }> {
    const sessionToken =
      payload.session_token !== undefined
        ? payload.session_token
        : typeof window !== 'undefined'
          ? (localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || null)
          : null;

    const requestPayload: LoginPayload = {
      ...payload,
      session_token: sessionToken,
    };

    const response = await clientHttp.post<{ success?: boolean; message?: string }>('/auth/login', requestPayload);
    return {
      success: typeof response === 'object' && response !== null && 'success' in response ? Boolean(response.success) : true,
      message: (typeof response === 'object' && response !== null && 'message' in response ? response.message : '') || 'Logged in successfully',
    };
  },

  /**
   * POST /api/v1/auth/signup
   */
  signup(payload: SignupPayload): Promise<UserResponse> {
    const sessionToken =
      payload.session_token !== undefined
        ? payload.session_token
        : typeof window !== 'undefined'
          ? (localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || null)
          : null;

    const requestPayload: SignupPayload = {
      ...payload,
      session_token: sessionToken,
    };

    return clientHttp.post<UserResponse>('/auth/signup', requestPayload);
  },

  /**
   * POST /api/v1/auth/logout - Invalidate user session on backend
   */
  async logout(): Promise<APIResponse> {
    return clientHttp.post<APIResponse>('/auth/logout', {}, { skipErrorToast: true });
  },

  /**
   * POST /api/v1/auth/refresh
   */
  async refreshToken(payload: RefreshTokenPayload): Promise<boolean> {
    const response = await clientHttp.post<{ success?: boolean } | boolean>('/auth/refresh', payload, {
      skipErrorToast: true,
    });
    return typeof response === 'object' && response !== null ? Boolean(response.success) : Boolean(response);
  },

  /**
   * GET /api/v1/auth/me - Fetch current user profile from real backend session
   */
  getCurrentUser(): Promise<UserResponse> {
    return clientHttp.get<UserResponse>('/auth/me', { skipErrorToast: true });
  },

  /**
   * Server-side fetch (SSR)
   */
  getServerUser(): Promise<UserResponse> {
    return clientHttp.get<UserResponse>('/auth/me', { skipErrorToast: true });
  },
};
