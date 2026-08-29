# Frontend

## Stack

- Vue 3.5 y TypeScript estricto + Vite + `@tailwindcss/vite` (`@import "tailwindcss"` + `@theme` brand `oklch`).
- pnpm, Vue Router (9 rutas, guard `auth/me`), TanStack Vue Query (`QueryClient` 30s stale), Pinia (auth efímero + `selectedWorkspaceId` persistido), Web Push VAPID nativo, Zod (`z.flattenError`), alias `@`.

## Estado

Momentum separa el estado según su naturaleza:

- TanStack Vue Query gestiona server state, caché, queries y mutations. Una única query `auth/me` representa la sesión como `User | null`: el visitante anónimo queda cacheado hasta login/logout y el usuario autenticado se revalida a los 5 minutos. App, guard, header, landing e invitaciones comparten ese resultado; notificaciones refresca cada 60 segundos y al recuperar foco.
- Pinia gestiona estado global del cliente, como workspace seleccionado (`localStorage momentum:workspaceId`), usuario efímero, estado de sesión `unknown/anonymous/authenticated/error` y UI global. Header, landing e invitaciones renderizan desde ese espejo reactivo. Los datos del usuario no se persisten en almacenamiento web.
- Vue local state gestiona estado efímero de componentes (`useFormErrors`).
- La preferencia de browser notifications se guarda por usuario/dispositivo en `localStorage`; el navegador conserva la suscripción (`endpoint`/`p256dh`/`auth`) y `browserNotifications.ts` mantiene su ciclo de vida sin duplicarla.

Pinia no sustituye a TanStack Vue Query ni funciona como caché manual de respuestas de la API.

## Rutas y vistas

- `/` landing, `/register`, `/login`, `/confirm-account`, `/invitations/accept`, `/workspaces`, `/workspaces/:id`, `/settings` y fallback 404. Settings permite activar browser notifications con estados no soportado, denegado, inactivo y activo. La ruta de invitación admite token de email o ID desde notificación y conserva el token en `sessionStorage`. Sin sesión no consulta ni muestra metadata y redirige a registro; el destino se conserva durante registro, confirmación y login. Solo el destinatario autenticado puede ver invitador/workspace/rol y aceptar, mientras otras cuentas únicamente pueden volver a workspaces.

## API

- `fetch` wrapper `VITE_BACKEND_URL` + `credentials:include`, `ApiError` `{code,details}` y política explícita de refresh. Las operaciones públicas de auth nunca renuevan; `auth/me` solo intenta refresh cuando la pista no sensible `momentum:sessionHint` indica una sesión previa; las operaciones protegidas conservan la renovación transparente mediante Web Locks. Login siembra Query/Pinia con su propia respuesta y logout limpia toda caché asociada a la cuenta. Las generaciones y el evento `storage` sincronizan transiciones entre pestañas. `api/invitations.ts` expone creación, preview y aceptación; `api/notifications.ts` lista, enlaza, marca y sincroniza suscripciones Web Push VAPID mediante JSON.

## Interfaz

Las interfaces deben contemplar estados de carga, error, datos vacíos y éxito. `NotificationBell` muestra contador, panel reciente, marcado leído y `Review invitation`; presenta un resumen de pendientes una vez por pestaña y actualiza el badge nativo cuando está disponible. Vite genera `/sw.js`; el permiso se solicita únicamente desde Settings y el arranque registra Web Push solo para preferencias activas con permiso concedido. La variable `VITE_VAPID_PUBLIC_KEY` contiene clave pública, nunca secretos. Logout elimina listas y detalles cacheados por cuenta y desuscribe `PushSubscription` best effort. La lógica de negocio y la autorización efectiva pertenecen al backend; el frontend solo adapta la presentación y la navegación.
