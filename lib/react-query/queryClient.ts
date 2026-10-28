import { QueryClient } from '@tanstack/react-query';

export const FIVE_MINUTES_MS = 5 * 60 * 1000;
export const TEN_MINUTES_MS = 10 * 60 * 1000;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES_MS, // 5 minutes stale time as requested
        gcTime: TEN_MINUTES_MS,     // 10 minutes cache garbage collection
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const status = (error as { statusCode?: number }).statusCode;
            if (status && status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
