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
