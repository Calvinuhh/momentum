export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: { field: string; message: string }[]
  }
}

export class ApiError extends Error {
  status: number
  code: string
  details?: { field: string; message: string }[]

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message)
    this.status = status
    this.code = body.error.code
    this.details = body.error.details
  }
}

const baseUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const refreshPath = '/api/v1/auth/refresh'
const sessionGenerationKey = 'momentum:sessionGeneration'
const sessionTransitionPaths = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/invitations/claim',
])

function request(path: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${baseUrl}${path}`, { ...init, headers, credentials: 'include' })
}

async function refreshSession(): Promise<boolean> {
  for (const delay of [0, 100, 250, 500, 1_000, 1_500, 2_000]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    const response = await request(refreshPath, { method: 'POST' })
    if (response.status !== 409) return response.status === 204
  }
  return false
}

function getSessionGeneration(): string {
  return localStorage.getItem(sessionGenerationKey) ?? ''
}

function bumpSessionGeneration() {
  localStorage.setItem(sessionGenerationKey, crypto.randomUUID())
}

function withSessionLock<T>(callback: () => Promise<T>): Promise<T> {
  return navigator.locks.request('momentum-session', callback)
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const generation = getSessionGeneration()
  let res: Response

  if (sessionTransitionPaths.has(path) && navigator.locks) {
    res = await withSessionLock(async () => {
      const response = await request(path, init)
      if (path === '/api/v1/auth/logout' || response.ok) bumpSessionGeneration()
      return response
    })
  } else {
    res = await request(path, init)
    if (sessionTransitionPaths.has(path) && (path === '/api/v1/auth/logout' || res.ok)) {
      bumpSessionGeneration()
    }
  }

  if (
    res.status === 401 &&
    navigator.locks &&
    path !== '/api/v1/auth/login' &&
    path !== refreshPath
  ) {
    res = await withSessionLock(async () => {
      if (getSessionGeneration() !== generation) return res
      const retried = await request(path, init)
      if (retried.status !== 401) return retried
      return (await refreshSession()) ? request(path, init) : retried
    })
  }

  if (res.status === 204) return undefined as T

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(res.status, json as ApiErrorBody)
  }

  return json as T
}

export const fieldErrors = (details: { field: string; message: string }[] = []) =>
  Object.fromEntries(details.filter((d) => d.field).map((d) => [d.field, d.message])) as Record<string, string>
