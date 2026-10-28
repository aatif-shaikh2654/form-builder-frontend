export const USER_QUERY_KEYS = {
  session: ['auth', 'session'] as const,
  currentUser: ['auth', 'me'] as const,
} as const;

export const USER_STALE_TIME = Infinity; // Retain fresh/stale session across all pages without refetching
export const USER_GC_TIME = 24 * 60 * 60 * 1000;    // 24 hours cache retention

export const SESSION_TOKEN_STORAGE_KEY = 'x-session-token';

export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORMS: '/forms',
  HOME: '/',
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'You have been logged out.',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGIN_ERROR: 'Login failed. Please check your credentials.',
} as const;

export const PASSWORD_MIN_LENGTH = 6;
