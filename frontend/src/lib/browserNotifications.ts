import swUrl from '@/sw.ts?worker&url'
import { deletePushInstallation, registerPushInstallation } from '@/api/notifications'

export type BrowserNotificationState = 'unsupported' | 'denied' | 'inactive' | 'active'

const preferenceKey = (userId: string) => `momentum:browserNotifications:${userId}`
const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
let contextPromise: Promise<ServiceWorkerRegistration> | undefined
let currentUserId: string | undefined
let currentEndpoint: string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function getSubscriptionKeys(sub: PushSubscription) {
  const json = sub.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } }
  if (json.keys?.p256dh && json.keys?.auth)
    return { endpoint: sub.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }
  const toB64 = (b: ArrayBuffer | null) =>
    b
      ? btoa(String.fromCharCode(...new Uint8Array(b)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/g, '')
      : ''
  return {
    endpoint: sub.endpoint,
    p256dh: toB64(sub.getKey('p256dh')),
    auth: toB64(sub.getKey('auth')),
  }
}

function supportedSync(): boolean {
  return Boolean(vapidPublicKey) && window.isSecureContext && 'PushManager' in window
}

async function getContext(): Promise<ServiceWorkerRegistration> {
  if (!contextPromise) {
    contextPromise = (async () => {
      // cleanup legacy Firebase scope best effort
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const r of regs) {
          if (r.scope.includes('firebase-cloud-messaging-push-scope')) await r.unregister()
        }
      } catch {
        // ignore
      }
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        type: import.meta.env.DEV ? 'module' : 'classic',
      })
      await navigator.serviceWorker.ready
      return registration
    })().catch((error) => {
      contextPromise = undefined
      throw error
    })
  }
  return contextPromise
}

async function registerCurrentUser(userId: string) {
  currentUserId = userId
  const registration = await getContext()
  let sub = await registration.pushManager.getSubscription()
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey!),
    })
  }
  const { endpoint, p256dh, auth } = getSubscriptionKeys(sub)
  currentEndpoint = endpoint
  if (!p256dh || !auth) throw new Error('Missing subscription keys')
  await registerPushInstallation({ endpoint, p256dh, auth, userId })
}

export async function getBrowserNotificationState(
  userId: string,
): Promise<BrowserNotificationState> {
  if (!supportedSync()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return localStorage.getItem(preferenceKey(userId)) === 'true' &&
    Notification.permission === 'granted'
    ? 'active'
    : 'inactive'
}

export async function startBrowserNotifications(userId: string) {
  if (localStorage.getItem(preferenceKey(userId)) !== 'true' || !supportedSync()) return
  if (Notification.permission !== 'granted') return
  await registerCurrentUser(userId)
}

export async function enableBrowserNotifications(userId: string) {
  if (!supportedSync()) return 'unsupported' as const
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (permission !== 'granted')
    return permission === 'denied' ? ('denied' as const) : ('inactive' as const)

  await registerCurrentUser(userId)
  localStorage.setItem(preferenceKey(userId), 'true')
  return 'active' as const
}

export async function disableBrowserNotifications(userId: string) {
  localStorage.removeItem(preferenceKey(userId))
  if (!supportedSync()) return 'unsupported' as const

  currentUserId = userId
  const registration = await getContext()
  const sub = await registration.pushManager.getSubscription()
  const endpoint = sub?.endpoint ?? currentEndpoint
  if (endpoint) await deletePushInstallation({ endpoint, userId })
  if (sub) await sub.unsubscribe()
  currentUserId = undefined
  currentEndpoint = undefined
  return 'inactive' as const
}

export async function unregisterBrowserNotificationsForLogout(userId: string) {
  if (!contextPromise || currentUserId !== userId) return
  try {
    const registration = await contextPromise
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      const { endpoint } = getSubscriptionKeys(sub)
      currentEndpoint = endpoint
      try {
        await sub.unsubscribe()
      } catch {
        // ignore
      }
      // best effort server cleanup is handled by family delete on logout; no extra request needed
    }
  } finally {
    if (currentUserId === userId) currentUserId = undefined
    currentEndpoint = undefined
  }
}
