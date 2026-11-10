import axios from 'axios';
import { BASE_URL } from './client';

/**
 * Constructs request headers for server-side Axios requests,
 * forwarding incoming cookies and extracting the x-session-token.
 */
export function buildServerHeaders(cookiesHeader?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (cookiesHeader) {
    headers['Cookie'] = cookiesHeader;
    const sessionMatch = cookiesHeader.match(/(?:^|;\s*)(?:x-session-token|session_token)=([^;]+)/);
    if (sessionMatch) {
      headers['x-session-token'] = decodeURIComponent(sessionMatch[1]);
    }
  }

  return headers;
}

/**
 * Executes a server-side GET request using Axios with forwarded cookies and session token.
 */
export async function serverGet<T>(
  path: string,
  cookiesHeader?: string,
  defaultValue: T | null = null
): Promise<T | null> {
  try {
    const res = await axios.get<T | { data?: T }>(path, {
      baseURL: BASE_URL,
      headers: buildServerHeaders(cookiesHeader),
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const body = res.data;
    if (body && typeof body === 'object' && 'data' in body && (body as { data?: T }).data !== undefined) {
      return (body as { data: T }).data ?? defaultValue;
    }
    return (body as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Higher-order function that creates server-side Axios fetchers.
 * Centralizes cookie/session header forwarding, Axios execution, response unwrapping,
 * and error suppression without repeating try/catch blocks across services.
 */
export function createServerFetcher<T, TArgs extends unknown[] = []>(
  pathBuilder: (...args: TArgs) => string,
  defaultValue: T | null = null
) {
  return async (...args: [...TArgs, cookiesHeader?: string]): Promise<T | null> => {
    const hasCookies = args.length > pathBuilder.length && typeof args[args.length - 1] === 'string';
    const cookiesHeader = hasCookies ? (args[args.length - 1] as string) : undefined;
    const pathArgs = (hasCookies ? args.slice(0, -1) : args) as unknown as TArgs;
    const path = pathBuilder(...pathArgs);

    return serverGet<T>(path, cookiesHeader, defaultValue);
  };
}

