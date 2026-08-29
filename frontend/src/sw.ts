/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event: PushEvent) => {
  const data = (() => {
    try {
      return (
        (event.data?.json() as { title?: string; body?: string; url?: string; tag?: string }) ?? {}
      )
    } catch {
      return { body: event.data?.text() } as { body?: string }
    }
  })()

  const title = (data as { title?: string }).title ?? 'Momentum'
  const options: NotificationOptions & { data?: { url?: string } } = {
    body: (data as { body?: string }).body ?? '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: (data as { tag?: string }).tag,
    data: { url: (data as { url?: string }).url ?? '/workspaces' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/workspaces'
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        if ('focus' in client) {
          try {
            if (
              client.url.includes(self.location.origin) &&
              'navigate' in (client as WindowClient)
            ) {
              await (client as WindowClient).navigate(url)
            }
            return (client as WindowClient).focus()
          } catch {
            // ignore
          }
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })(),
  )
})

// ponytail: pushsubscriptionchange re-added in 6R with real re-subscribe + PUT /installations
export {}
