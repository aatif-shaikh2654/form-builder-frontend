'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { FORMS_QUERY_KEY } from '@/features/forms/hooks/useForms';
import type {
  LoginPayload,
  SignupPayload,
  RefreshTokenPayload,
  SessionData,
  UserResponse,
} from '@/types/api.types';
import { toast } from 'sonner';
import { showApiErrorToast } from '@/lib/api/client';
import { useBuilderStore } from '@/features/builder/store/builderStore';

import {
  USER_QUERY_KEYS,
  USER_STALE_TIME,
  USER_GC_TIME,
  SESSION_TOKEN_STORAGE_KEY,
  AUTH_MESSAGES,
} from '../constants/user.constants';
export { USER_QUERY_KEYS, USER_STALE_TIME, USER_GC_TIME };

/**
 * useSessionQuery - GET /api/v1/auth/session
 * Uses useQuery for fetching guest session or active user session info.
 * Maintains 5-minute stale time.
 */
export function useSessionQuery() {
  return useQuery<SessionData>({
    queryKey: USER_QUERY_KEYS.session,
    queryFn: async () => {
      const session = await userService.getSession();
      // Store session token in localStorage ONLY for guest sessions (no authenticated user_id)
      if (!session?.user_id && session?.session_token && typeof window !== 'undefined') {
        const existingToken = localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
        if (!existingToken) {
          localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, session.session_token);
        }
      }
      return session;
    },
    staleTime: USER_STALE_TIME,
    gcTime: USER_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * useCurrentUserQuery - GET /api/v1/auth/me
 * Uses useQuery for fetching authenticated user profile.
 * Maintains persistent stale time and avoids re-querying across pages.
 */
export function useCurrentUserQuery(options?: { enabled?: boolean; initialData?: UserResponse | null }) {
  return useQuery<UserResponse | null>({
    queryKey: USER_QUERY_KEYS.currentUser,
    queryFn: async () => {
      try {
        const profile = await userService.getCurrentUser();
        return profile;
      } catch {
        return null;
      }
    },
    enabled: options?.enabled ?? true,
    ...(options?.initialData
      ? { initialData: options.initialData, initialDataUpdatedAt: 0 }
      : {}),
    staleTime: USER_STALE_TIME,
    gcTime: USER_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * useLoginMutation - POST /api/v1/auth/login
 * Uses useMutation for authentication.
 * Removes guest session token from localStorage and refreshes session, user profile, and user forms.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginPayload) => userService.login(credentials),
    onSuccess: async (res) => {
      if (res.success) {
        // 1. Remove guest session token from localStorage upon successful login
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
        }

        // 2. Populate fresh session & user profile without wiping in-memory builder store
        try {
          const session = await userService.getSession();
          queryClient.setQueryData(USER_QUERY_KEYS.session, session);
          if (session?.user_id) {
            const profile = await userService.getCurrentUser();
            queryClient.setQueryData(USER_QUERY_KEYS.currentUser, profile);
          }
        } catch {
          // If direct fetch errors, queryClient invalidation will handle refetch
        }
        await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.session });
        await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentUser });
        await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
        toast.success(res.message || AUTH_MESSAGES.LOGIN_SUCCESS);
      } else {
        showApiErrorToast(res.message || AUTH_MESSAGES.LOGIN_ERROR);
      }
    },
  });
}

/**
 * useSignupMutation - POST /api/v1/auth/signup
 * Uses useMutation for creating a new user account.
 * Removes guest session token from localStorage and invalidates session, user profile, and forms queries.
 */
export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SignupPayload) => userService.signup(payload),
    onSuccess: async (newUser) => {
      // 1. Remove guest session token from localStorage upon successful signup
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      }

      // 2. Store fresh user data & refresh queries without wiping in-memory builder store
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser, newUser);
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.session });
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentUser });
      await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      toast.success(AUTH_MESSAGES.SIGNUP_SUCCESS);
    },
  });
}

/**
 * useLogoutMutation - POST /api/v1/auth/logout
 * Uses useMutation to invalidate the session on backend and clear client cache and local storage.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.logout(),
    onSettled: async () => {
      // Completely wipe all stale cache and reset builder state
      queryClient.clear();
      useBuilderStore.getState().resetBuilder();
      queryClient.setQueryData(USER_QUERY_KEYS.session, null);
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser, null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      }
    },
  });
}

/**
 * useRefreshTokenMutation - POST /api/v1/auth/refresh
 * Uses useMutation for refreshing auth tokens.
 */
export function useRefreshTokenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RefreshTokenPayload) => userService.refreshToken(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentUser });
    },
  });
}
