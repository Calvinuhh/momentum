import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  registered: undefined as ((fid: string) => void) | undefined,
  unregistered: undefined as ((fid: string) => void) | undefined,
  isSupported: vi.fn<() => Promise<boolean>>(),
  getMessaging: vi.fn<() => object>(() => ({})),
  onRegistered: vi.fn<(_messaging: unknown, callback: (fid: string) => void) => () => void>((_messaging, callback) => {
    mocks.registered = callback
    return vi.fn<() => void>()
  }),
  onUnregistered: vi.fn<(_messaging: unknown, callback: (fid: string) => void) => () => void>((_messaging, callback) => {
    mocks.unregistered = callback
    return vi.fn<() => void>()
  }),
  register: vi.fn<(...args: unknown[]) => Promise<void>>(),
  unregister: vi.fn<(...args: unknown[]) => Promise<void>>(),
  registerApi: vi.fn<(data: { fid: string; userId: string }) => Promise<void>>(),
  deleteApi: vi.fn<(data: { fid: string; userId: string }) => Promise<void>>(),
  requestPermission: vi.fn<() => Promise<NotificationPermission>>(),
  registerServiceWorker: vi.fn<() => Promise<object>>(),
}))

vi.mock('firebase/messaging', () => ({
  getMessaging: mocks.getMessaging,
  isSupported: mocks.isSupported,
  onRegistered: mocks.onRegistered,
  onUnregistered: mocks.onUnregistered,
  register: mocks.register,
  unregister: mocks.unregister,
}))

vi.mock('@/firebase-messaging-sw.ts?worker&url', () => ({
  default: '/firebase-messaging-sw.js',
}))

vi.mock('@/lib/firebase', () => ({
  firebaseConfigured: true,
  firebaseVapidKey: 'public-vapid-key',
  getFirebaseApp: () => ({}),
}))

vi.mock('@/api/notifications', () => ({
  registerPushInstallation: mocks.registerApi,
  deletePushInstallation: mocks.deleteApi,
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  localStorage.clear()
  mocks.registered = undefined
  mocks.unregistered = undefined
  mocks.isSupported.mockResolvedValue(true)
  mocks.registerApi.mockResolvedValue(undefined)
  mocks.deleteApi.mockResolvedValue(undefined)
  mocks.requestPermission.mockResolvedValue('granted')
  mocks.registerServiceWorker.mockResolvedValue({})
  mocks.register.mockImplementation(async () => mocks.registered?.(`c${'a'.repeat(21)}`))
  mocks.unregister.mockImplementation(async () => mocks.unregistered?.(`c${'a'.repeat(21)}`))
  vi.stubGlobal('navigator', { serviceWorker: { register: mocks.registerServiceWorker } })
  vi.stubGlobal('Notification', {
    permission: 'granted',
    requestPermission: mocks.requestPermission,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('browser notifications', () => {
  test('starts only for an enabled user without requesting permission', async () => {
    const userId = 'a'.repeat(24)
    localStorage.setItem(`momentum:browserNotifications:${userId}`, 'true')
    const { startBrowserNotifications } = await import('../browserNotifications')

    await startBrowserNotifications(userId)

    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.register).toHaveBeenCalledOnce()
    expect(mocks.registerApi).toHaveBeenCalledWith({
      fid: `c${'a'.repeat(21)}`,
      userId,
    })
  })

  test('does nothing on startup when the preference is inactive', async () => {
    const { startBrowserNotifications } = await import('../browserNotifications')

    await startBrowserNotifications('a'.repeat(24))

    expect(mocks.isSupported).not.toHaveBeenCalled()
    expect(mocks.requestPermission).not.toHaveBeenCalled()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  test('requests permission only when explicitly enabled', async () => {
    const userId = 'a'.repeat(24)
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: mocks.requestPermission,
    })
    const { enableBrowserNotifications } = await import('../browserNotifications')

    await expect(enableBrowserNotifications(userId)).resolves.toBe('active')

    expect(mocks.requestPermission).toHaveBeenCalledOnce()
    expect(localStorage.getItem(`momentum:browserNotifications:${userId}`)).toBe('true')
    expect(mocks.registerApi).toHaveBeenCalledOnce()
  })

  test('removes the association and preference when disabled', async () => {
    const userId = 'a'.repeat(24)
    const { disableBrowserNotifications, enableBrowserNotifications } = await import('../browserNotifications')
    await enableBrowserNotifications(userId)
    mocks.deleteApi.mockClear()

    await expect(disableBrowserNotifications(userId)).resolves.toBe('inactive')

    expect(localStorage.getItem(`momentum:browserNotifications:${userId}`)).toBeNull()
    expect(mocks.unregister).toHaveBeenCalledOnce()
    expect(mocks.deleteApi).toHaveBeenCalledWith({
      fid: `c${'a'.repeat(21)}`,
      userId,
    })
  })
})
