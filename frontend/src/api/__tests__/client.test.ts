import { afterEach, describe, expect, test, vi } from 'vitest'
import { ApiError, apiFetch } from '../client'

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

function installSessionLocks() {
  let lock = Promise.resolve()
  vi.stubGlobal('navigator', {
    locks: {
      request: (_name: string, callback: () => Promise<unknown>) => {
        const result = lock.then(callback, callback)
        lock = result.then(
          () => undefined,
          () => undefined,
        )
        return result
      },
    },
  })
}

describe('apiFetch session refresh', () => {
  test('shares one refresh across concurrent unauthorized requests', async () => {
    installSessionLocks()

    let refreshed = false
    const fetchMock = vi.fn<FetchMock>(async (input) => {
      const path = new URL(input.toString()).pathname
      if (path === '/api/v1/auth/refresh') {
        refreshed = true
        return new Response(null, { status: 204 })
      }

      if (!refreshed) {
        return Response.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
          { status: 401 },
        )
      }
      return Response.json({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      Promise.all([apiFetch('/api/v1/workspaces'), apiFetch('/api/v1/auth/me')]),
    ).resolves.toEqual([{ ok: true }, { ok: true }])

    expect(
      fetchMock.mock.calls.filter(([input]) => new URL(input.toString()).pathname === '/api/v1/auth/refresh'),
    ).toHaveLength(1)
  })

  test('does not retry an old request after the authenticated account changes', async () => {
    installSessionLocks()
    let resolveOldRequest: ((response: Response) => void) | undefined
    const fetchMock = vi.fn<FetchMock>((input) => {
      const path = new URL(input.toString()).pathname
      if (path === '/api/v1/auth/login') {
        return Promise.resolve(Response.json({ user: { id: 'new-user', email: 'new@example.com' } }))
      }
      return new Promise<Response>((resolve) => {
        resolveOldRequest = resolve
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const oldRequest = apiFetch('/api/v1/workspaces/old', { method: 'DELETE' })
    await apiFetch('/api/v1/auth/login', { method: 'POST', body: '{}' })
    resolveOldRequest?.(
      Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
        { status: 401 },
      ),
    )

    await expect(oldRequest).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
