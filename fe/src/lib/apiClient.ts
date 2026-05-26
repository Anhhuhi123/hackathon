import { useAuthStore } from '../stores/authStore'

type RequestInitWithRetry = RequestInit & { _retry?: boolean }

let logoutHandler: (() => void) | null = null

export function setLogoutHandler(fn: () => void) {
  logoutHandler = fn
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
    if (!res.ok) return false
    const data = await res.json()
    // assume { access_token }
    if (data?.access_token) {
      useAuthStore.getState().setAccessToken(data.access_token)
      return true
    }
    return false
  } catch (err) {
    return false
  }
}

export async function apiFetch(input: RequestInfo, init?: RequestInitWithRetry) {
  const { accessToken } = useAuthStore.getState()
  const headers = new Headers(init?.headers as HeadersInit)
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const opts: RequestInitWithRetry = { ...(init || {}), headers, credentials: 'include' }

  const res = await fetch(input, opts)

  if (res.status === 401 && !init?._retry) {
    const refreshed = await refreshToken()
    if (refreshed) {
      // retry original request once
      return apiFetch(input, { ...(init || {}), _retry: true })
    }
    // refresh failed — call logout handler if provided
    if (logoutHandler) logoutHandler()
    const err: any = new Error('REFRESH_FAILED')
    err.code = 'REFRESH_FAILED'
    throw err
  }

  return res
}

export async function apiJson<T = any>(input: RequestInfo, init?: RequestInitWithRetry) {
  const res = await apiFetch(input, init)
  const contentType = res.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) return (await res.json()) as T
  return null as unknown as T
}

export const fetchApi = apiFetch

export default { apiFetch, apiJson, fetchApi, setLogoutHandler }
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        useAuthStore.getState().setAccessToken(data.access_token);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to refresh token', error);
    return false;
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  const token = useAuthStore.getState().accessToken;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401 && endpoint !== '/api/v1/auth/login') {
    // Try refreshing the token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry the original request
      const newToken = useAuthStore.getState().accessToken;
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
      }
      response = await fetch(url, { ...fetchOptions, headers });
    } else {
      // Clear token and possibly redirect to login if not already there
      useAuthStore.getState().setAccessToken(null);
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
  }

  return response;
}
