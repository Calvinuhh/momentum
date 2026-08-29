import { ApiError, apiFetch, getSessionGeneration, hasSessionHint, setSessionHint } from './client'

export type User = { id: string; email: string }

export function register(data: { email: string; password: string }) {
  return apiFetch<{ user: User }>(
    '/api/v1/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    { refresh: false },
  )
}

export function login(data: { email: string; password: string }) {
  return apiFetch<{ user: User }>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    { refresh: false },
  )
}

export function verifyEmail(data: { email: string; code: string }) {
  return apiFetch<{ user: User }>(
    '/api/v1/auth/verify-email',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    { refresh: false },
  )
}

export async function getSession(): Promise<User | null> {
  const generation = getSessionGeneration()
  try {
    const response = await apiFetch<{ user: User }>(
      '/api/v1/auth/me',
      {},
      { refresh: hasSessionHint() },
    )
    setSessionHint(true)
    return response.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (getSessionGeneration() !== generation) {
        try {
          const retry = await apiFetch<{ user: User }>(
            '/api/v1/auth/me',
            {},
            { refresh: hasSessionHint() },
          )
          setSessionHint(true)
          return retry.user
        } catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401) {
            setSessionHint(false)
            return null
          }
          throw retryError
        }
      }
      setSessionHint(false)
      return null
    }
    throw error
  }
}

export function logout() {
  return apiFetch<void>('/api/v1/auth/logout', { method: 'POST' }, { refresh: false })
}
