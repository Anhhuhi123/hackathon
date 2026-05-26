import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

export type RequestInitWithRetry = RequestInit & { _retry?: boolean }

let logoutHandler: (() => void) | null = null

export function setLogoutHandler(fn: () => void) {
  logoutHandler = fn
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data?.access_token) {
      useAuthStore.getState().setAccessToken(data.access_token)
      return true
    }
    return false
  } catch (err) {
    console.error('Failed to refresh token', err)
    return false
  }
}

export async function apiFetch(input: RequestInfo, init?: RequestInitWithRetry): Promise<Response> {
  const { accessToken } = useAuthStore.getState()
  const headers = new Headers(init?.headers as HeadersInit)

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (!headers.has('Content-Type') && init?.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  let url = input
  if (typeof input === 'string') {
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      url = `${API_URL}${input}`
    }
  }

  const opts: RequestInitWithRetry = { ...(init || {}), headers, credentials: 'include' }

  const res = await fetch(url, opts)

  const endpoint = typeof input === 'string' ? input : ''
  const isLoginEndpoint = endpoint.includes('/api/v1/auth/login')

  if (res.status === 401 && !init?._retry && !isLoginEndpoint) {
    const refreshed = await refreshToken()
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`)
      }
      return apiFetch(input, { ...(init || {}), _retry: true, headers })
    }

    // Refresh failed: clear token and logout
    useAuthStore.getState().setAccessToken(null)
    if (logoutHandler) logoutHandler()

    if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
    }

    const err: any = new Error('REFRESH_FAILED')
    err.code = 'REFRESH_FAILED'
    throw err
  }

  return res
}

export async function apiJson<T = any>(input: RequestInfo, init?: RequestInitWithRetry): Promise<T> {
  const res = await apiFetch(input, init)
  const contentType = res.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return null as unknown as T
}

export const fetchApi = apiFetch

export default { apiFetch, apiJson, fetchApi, setLogoutHandler }
