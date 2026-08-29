import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  registerApi:
    vi.fn<
      (data: { endpoint: string; p256dh: string; auth: string; userId: string }) => Promise<void>
    >(),
  deleteApi:
    vi.fn<
      (data: { endpoint: string; userId: string; p256dh?: string; auth?: string }) => Promise<void>
    >(),
  requestPermission: vi.fn<() => Promise<NotificationPermission>>(),
  subscribe: vi.fn<() => Promise<PushSubscription>>(),
  getSubscription: vi.fn<() => Promise<PushSubscription | null>>(),
  unsubscribe: vi.fn<() => Promise<boolean>>(),
  registerServiceWorker: vi.fn<() => Promise<ServiceWorkerRegistration>>(),
}))

vi.mock('@/sw.ts?worker&url', () => ({
  default: '/sw.js',
}))

vi.mock('@/api/notifications', () => ({
  registerPushInstallation: mocks.registerApi,
  deletePushInstallation: mocks.deleteApi,
}))

function createSubscription(endpoint = 'https://example.com/push/abc'): PushSubscription {
  return {
    endpoint,
    expirationTime: null,
    options: { applicationServerKey: null, userVisibleOnly: true },
    getKey: (name: string) => {
      if (name === 'p256dh') return new Uint8Array(65).buffer
      if (name === 'auth') return new Uint8Array(16).buffer
      return null
    },
    toJSON: () => ({
      endpoint,
      expirationTime: null,
      keys: { p256dh: 'a'.repeat(87), auth: 'a'.repeat(22) },
    }),
    unsubscribe: mocks.unsubscribe,
  } as unknown as PushSubscription
}

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  localStorage.clear()
  mocks.registerApi.mockResolvedValue(undefined)
  mocks.deleteApi.mockResolvedValue(undefined)
  mocks.requestPermission.mockResolvedValue('granted')
  mocks.getSubscription.mockResolvedValue(null)
  mocks.subscribe.mockResolvedValue(createSubscription())
  mocks.unsubscribe.mockResolvedValue(true)
  mocks.registerServiceWorker.mockResolvedValue({
    pushManager: { getSubscription: mocks.getSubscription, subscribe: mocks.subscribe },
  } as unknown as ServiceWorkerRegistration)
  vi.stubGlobal('navigator', {
    serviceWorker: {
      register: mocks.registerServiceWorker,
      getRegistrations: vi.fn<() => Promise<ServiceWorkerRegistration[]>>().mockResolvedValue([]),
      ready: Promise.resolve({} as ServiceWorkerRegistration),
    } as unknown as ServiceWorkerContainer,
  })
  vi.stubGlobal('Notification', {
    permission: 'granted',
    requestPermission: mocks.requestPermission,
  } as unknown as typeof Notification)
  vi.stubGlobal('PushManager', class PushManager {} as unknown as typeof PushManager)
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'a'.repeat(87))
  ;(import.meta.env as Record<string, string>).VITE_VAPID_PUBLIC_KEY = 'a'.repeat(87)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('browser notifications', () => {
  test('starts only for an enabled user without requesting permission', async () => {
    const userId = 'a'.repeat(24)
    localStorage.setItem(`momentum:browserNotifications:${userId}`, 'true')
    const { startBrowserNotifications } = await import('../browserNotifications')

    await startBrowserNotifications(userId)

    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.subscribe).toHaveBeenCalledOnce()
    expect(mocks.registerApi).toHaveBeenCalledWith({
      endpoint: 'https://example.com/push/abc',
      p256dh: 'a'.repeat(87),
      auth: 'a'.repeat(22),
      userId,
    })
  })

  test('does nothing on startup when the preference is inactive', async () => {
    const { startBrowserNotifications } = await import('../browserNotifications')

    await startBrowserNotifications('a'.repeat(24))

    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.subscribe).not.toHaveBeenCalled()
  })

  test('requests permission only when explicitly enabled', async () => {
    const userId = 'a'.repeat(24)
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: mocks.requestPermission,
    } as unknown as typeof Notification)
    const { enableBrowserNotifications } = await import('../browserNotifications')

    await expect(enableBrowserNotifications(userId)).resolves.toBe('active')

    expect(mocks.requestPermission).toHaveBeenCalledOnce()
    expect(localStorage.getItem(`momentum:browserNotifications:${userId}`)).toBe('true')
    expect(mocks.registerApi).toHaveBeenCalledOnce()
  })

  test('removes the association and preference when disabled', async () => {
    const userId = 'a'.repeat(24)
    const sub = createSubscription()
    mocks.getSubscription.mockResolvedValue(sub)
    const { disableBrowserNotifications, enableBrowserNotifications } =
      await import('../browserNotifications')
    await enableBrowserNotifications(userId)
    mocks.deleteApi.mockClear()

    await expect(disableBrowserNotifications(userId)).resolves.toBe('inactive')

    expect(localStorage.getItem(`momentum:browserNotifications:${userId}`)).toBeNull()
    expect(mocks.unsubscribe).toHaveBeenCalledOnce()
    expect(mocks.deleteApi).toHaveBeenCalledWith({
      endpoint: 'https://example.com/push/abc',
      userId,
    })
  })
})
