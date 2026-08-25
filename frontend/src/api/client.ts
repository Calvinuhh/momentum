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

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 204) return undefined as T

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(res.status, json as ApiErrorBody)
  }

  return json as T
}

export const fieldErrors = (details: { field: string; message: string }[] = []) =>
  Object.fromEntries(details.filter((d) => d.field).map((d) => [d.field, d.message])) as Record<string, string>
