import {
  getMessaging,
  isSupported,
  onRegistered,
  onUnregistered,
  register,
  unregister,
  type Messaging,
} from 'firebase/messaging'
import serviceWorkerUrl from '@/firebase-messaging-sw.ts?worker&url'
import { deletePushInstallation, registerPushInstallation } from '@/api/notifications'
import {
  firebaseConfigured,
  firebaseVapidKey,
  getFirebaseApp,
} from '@/lib/firebase'

export type BrowserNotificationState = 'unsupported' | 'denied' | 'inactive' | 'active'

const preferenceKey = (userId: string) => `momentum:browserNotifications:${userId}`
let contextPromise: Promise<{ messaging: Messaging; serviceWorker: ServiceWorkerRegistration }> | undefined
let currentUserId: string | undefined
let currentFid: string | undefined
let registrationSync = Promise.resolve()
let unregistrationSync = Promise.resolve()

async function supported() {
  if (!firebaseConfigured) return false
  return isSupported().catch(() => false)
}

async function getContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const serviceWorker = await navigator.serviceWorker.register(serviceWorkerUrl, {
        scope: '/firebase-cloud-messaging-push-scope',
        type: import.meta.env.DEV ? 'module' : 'classic',
      })
      const messaging = getMessaging(getFirebaseApp())

      onRegistered(messaging, (fid) => {
        currentFid = fid
        const userId = currentUserId
        registrationSync = userId ? registerPushInstallation({ fid, userId }) : Promise.resolve()
        void registrationSync.catch(() => undefined)
      })
      onUnregistered(messaging, (fid) => {
        if (currentFid === fid) currentFid = undefined
        const userId = currentUserId
        unregistrationSync = userId ? deletePushInstallation({ fid, userId }) : Promise.resolve()
        void unregistrationSync.catch(() => undefined)
      })

      return { messaging, serviceWorker }
    })().catch((error) => {
      contextPromise = undefined
      throw error
    })
  }
  return contextPromise
}

async function registerCurrentUser(userId: string) {
  currentUserId = userId
  const { messaging, serviceWorker } = await getContext()
  await register(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: serviceWorker,
  })
  await registrationSync
}

export async function getBrowserNotificationState(
  userId: string,
): Promise<BrowserNotificationState> {
  if (!(await supported())) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return localStorage.getItem(preferenceKey(userId)) === 'true' &&
    Notification.permission === 'granted'
    ? 'active'
    : 'inactive'
}

export async function startBrowserNotifications(userId: string) {
  if (localStorage.getItem(preferenceKey(userId)) !== 'true' || !(await supported())) return
  if (Notification.permission !== 'granted') return
  await registerCurrentUser(userId)
}

export async function enableBrowserNotifications(userId: string) {
  if (!(await supported())) return 'unsupported' as const
  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? ('denied' as const) : ('inactive' as const)

  await registerCurrentUser(userId)
  localStorage.setItem(preferenceKey(userId), 'true')
  return 'active' as const
}

export async function disableBrowserNotifications(userId: string) {
  localStorage.removeItem(preferenceKey(userId))
  if (!(await supported())) return 'unsupported' as const

  currentUserId = userId
  const { messaging } = await getContext()
  const results = await Promise.allSettled([
    currentFid ? deletePushInstallation({ fid: currentFid, userId }) : Promise.resolve(),
    unregister(messaging).then(() => unregistrationSync),
  ])
  const failure = results.find((result) => result.status === 'rejected')
  if (failure?.status === 'rejected') throw failure.reason
  currentUserId = undefined
  currentFid = undefined
  return 'inactive' as const
}

export async function unregisterBrowserNotificationsForLogout(userId: string) {
  if (!contextPromise || currentUserId !== userId) return
  try {
    const { messaging } = await contextPromise
    await unregister(messaging)
    await unregistrationSync
  } finally {
    if (currentUserId === userId) currentUserId = undefined
    currentFid = undefined
  }
}
