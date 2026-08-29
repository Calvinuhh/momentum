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

type ApiFetchOptions = { refresh?: boolean }

const baseUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const refreshPath = '/api/v1/auth/refresh'
export const SESSION_GENERATION_KEY = 'momentum:sessionGeneration'
export const SESSION_CLEARED_EVENT = 'momentum:session-cleared'
const refreshGenerationKey = 'momentum:refreshGeneration'
export const SESSION_HINT_KEY = 'momentum:sessionHint'
const sessionTransitionPaths = new Set(['/api/v1/auth/login', '/api/v1/auth/logout'])

export function hasSessionHint() {
  return localStorage.getItem(SESSION_HINT_KEY) === 'true'
}

export function setSessionHint(active: boolean, notify = true) {
  if (active) localStorage.setItem(SESSION_HINT_KEY, 'true')
  else {
    const hadSession = hasSessionHint()
    localStorage.removeItem(SESSION_HINT_KEY)
    if (hadSession && notify) window.dispatchEvent(new Event(SESSION_CLEARED_EVENT))
  }
}

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

export function getSessionGeneration(): string {
  return localStorage.getItem(SESSION_GENERATION_KEY) ?? ''
}

function bumpSessionGeneration() {
  localStorage.setItem(SESSION_GENERATION_KEY, crypto.randomUUID())
}

function getRefreshGeneration(): string {
  return localStorage.getItem(refreshGenerationKey) ?? ''
}

function bumpRefreshGeneration() {
  localStorage.setItem(refreshGenerationKey, crypto.randomUUID())
}

function withSessionLock<T>(callback: () => Promise<T>): Promise<T> {
  return navigator.locks.request('momentum-session', callback as never) as Promise<T>
}

function completeSessionTransition(path: string, response: Response) {
  if (path === '/api/v1/auth/logout') {
    setSessionHint(false, false)
    bumpSessionGeneration()
  } else if (response.ok) {
    setSessionHint(true)
    bumpSessionGeneration()
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> {
  const generation = getSessionGeneration()
  const refreshGeneration = getRefreshGeneration()
  let res: Response

  if (sessionTransitionPaths.has(path) && navigator.locks) {
    res = await withSessionLock(async () => {
      const response = await request(path, init)
      completeSessionTransition(path, response)
      return response
    })
  } else {
    res = await request(path, init)
    if (sessionTransitionPaths.has(path)) completeSessionTransition(path, res)
  }

  if (
    res.status === 401 &&
    options.refresh !== false &&
    navigator.locks &&
    path !== '/api/v1/auth/login' &&
    path !== refreshPath
  ) {
    res = await withSessionLock(async () => {
      if (getSessionGeneration() !== generation) return res
      if (getRefreshGeneration() !== refreshGeneration) return request(path, init)
      const refreshed = await refreshSession()
      if (!refreshed) {
        setSessionHint(false)
        return res
      }
      if (getSessionGeneration() !== generation) return res
      setSessionHint(true)
      bumpRefreshGeneration()
      return request(path, init)
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
  Object.fromEntries(details.filter((d) => d.field).map((d) => [d.field, d.message])) as Record<
    string,
    string
  >
