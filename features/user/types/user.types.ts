import type { UserResponse, LoginPayload, SignupPayload } from '@/types/api.types';

export type UserProfile = UserResponse;

export interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionLoading: boolean;
  isAuthenticating: boolean;
  isSigningUp: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkSession: () => Promise<void>;
}
