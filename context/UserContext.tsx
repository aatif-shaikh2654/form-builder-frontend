'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { UserProfile, UserContextType } from '@/features/user/types/user.types';
import type { LoginPayload, SignupPayload } from '@/types/api.types';
import {
  USER_QUERY_KEYS,
  useSessionQuery,
  useCurrentUserQuery,
  useLoginMutation,
  useSignupMutation,
} from '@/features/user/hooks/useUserAuth';
import {
  SESSION_TOKEN_STORAGE_KEY,
  AUTH_MESSAGES,
} from '@/features/user/constants/user.constants';
import { userService } from '@/features/user/services/userService';
import { useBuilderStore } from '@/features/builder/store/builderStore';
import { FORMS_QUERY_KEY } from '@/features/forms/hooks/useForms';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  initialUser?: UserProfile | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  initialUser = null,
}) => {
  const queryClient = useQueryClient();

  // GET: /api/v1/auth/session via useQuery
  const sessionQuery = useSessionQuery();

  // GET: /api/v1/auth/me via useQuery (only enabled when session returns user_id)
  const currentUserQuery = useCurrentUserQuery({
    enabled: Boolean(sessionQuery.data?.user_id),
    initialData: initialUser,
  });

  // POST: /api/v1/auth/login via useMutation
  const loginMutation = useLoginMutation();

  // POST: /api/v1/auth/signup via useMutation
  const signupMutation = useSignupMutation();

  const user: UserProfile | null = currentUserQuery.data ?? initialUser ?? null;
  const isAuthenticated = Boolean(user);
  const isAuthenticating = loginMutation.isPending;
  const isSigningUp = signupMutation.isPending;
  const isSessionLoading = sessionQuery.isLoading;

  const isLoading =
    sessionQuery.isLoading ||
    (Boolean(sessionQuery.data?.user_id) && currentUserQuery.isLoading) ||
    isAuthenticating ||
    isSigningUp;

  const checkSession = useCallback(async () => {
    await sessionQuery.refetch();
  }, [sessionQuery]);

  const refreshProfile = useCallback(async () => {
    await sessionQuery.refetch();
    if (sessionQuery.data?.user_id) {
      await currentUserQuery.refetch();
    }
  }, [sessionQuery, currentUserQuery]);

  const login = useCallback(
    async (credentials: LoginPayload) => {
      const res = await loginMutation.mutateAsync(credentials);
      if (!res.success) {
        throw new Error(res.message || 'Login failed');
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      }
      // Invalidate auth and forms queries so session and forms refresh without wiping builder state
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.session });
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentUser });
      await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
    },
    [loginMutation, queryClient]
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      await signupMutation.mutateAsync(payload);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      }
      // Invalidate auth and forms queries so session and forms refresh without wiping builder state
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.session });
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentUser });
      await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
    },
    [signupMutation, queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await userService.logout();
    } catch {
      // Proceed with cleanup even if network fails or session was already revoked
    } finally {
      // 1. Completely clear all cached queries (user, session, forms, drafts, responses)
      queryClient.clear();

      // 2. Reset in-memory form builder store
      useBuilderStore.getState().resetBuilder();

      // 3. Explicitly set queries to null so UI reacts immediately
      queryClient.setQueryData(USER_QUERY_KEYS.session, null);
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser, null);

      // 4. Remove session token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
      }

      toast.info(AUTH_MESSAGES.LOGOUT_SUCCESS);
    }
  }, [queryClient]);

  // Handle automatic cache cleanup and logout on 401 unauthorized
  React.useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }
  }, [logout]);

  const value = useMemo<UserContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isSessionLoading,
      isAuthenticating,
      isSigningUp,
      login,
      signup,
      logout,
      refreshProfile,
      checkSession,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      isSessionLoading,
      isAuthenticating,
      isSigningUp,
      login,
      signup,
      logout,
      refreshProfile,
      checkSession,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
