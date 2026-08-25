import { apiFetch } from './client'

export type User = { id: string; email: string }

export function register(data: { email: string; password: string }) {
  return apiFetch<{ user: User }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function login(data: { email: string; password: string }) {
  return apiFetch<{ user: User }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMe() {
  const response = await apiFetch<{ user: User }>('/api/v1/auth/me')
  return response.user
}

export function logout() {
  return apiFetch<void>('/api/v1/auth/logout', { method: 'POST' })
}
