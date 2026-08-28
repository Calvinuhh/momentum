# Frontend

## Stack

- Vue 3.5 y TypeScript estricto + Vite + `@tailwindcss/vite` (`@import "tailwindcss"` + `@theme` brand `oklch`).
- pnpm, Vue Router (8 rutas, guard `auth/me`), TanStack Vue Query (`QueryClient` 30s stale), Pinia (auth efímero + `selectedWorkspaceId` persistido), Zod (`z.flattenError`), alias `@`.

## Estado

Momentum separa el estado según su naturaleza:

- TanStack Vue Query gestiona server state, caché, queries y mutations (`auth/me` desde el header y el guard, `workspaces` y `['notifications',userId]`). La consulta de sesión usa `staleTime` de 5 minutos y no reintenta el `401` esperado; notificaciones refresca cada 60 segundos y al recuperar foco. `AppHeader` sincroniza auth con Pinia.
- Pinia gestiona estado global del cliente, como workspace seleccionado (`localStorage momentum:workspaceId`), `user` efímero y UI global. Header y landing renderizan la sesión desde `auth.isAuthed`, por lo que `auth.reset()` actualiza inmediatamente sus acciones después del logout.
- Vue local state gestiona estado efímero de componentes (`useFormErrors`).

Pinia no sustituye a TanStack Vue Query ni funciona como caché manual de respuestas de la API.

## Rutas y vistas

- `/` landing, `/register`, `/login`, `/confirm-account`, `/invitations/accept`, `/workspaces`, `/workspaces/:id` y fallback 404. La ruta de invitación admite token de email o ID desde notificación y conserva el token en `sessionStorage`. Sin sesión no consulta ni muestra metadata y redirige a registro; el destino se conserva durante registro, confirmación y login. Solo el destinatario autenticado puede ver invitador/workspace/rol y aceptar, mientras otras cuentas únicamente pueden volver a workspaces.

## API

- `fetch` wrapper `VITE_BACKEND_URL` + `credentials:include`, `ApiError` `{code,details}` y refresh transparente mediante Web Locks: serializa transiciones de sesión entre pestañas, reintenta la petición tras `204` e impide que una operación anterior se repita con otra cuenta. `api/invitations.ts` expone creación, preview y aceptación; `api/notifications.ts` lista, enlaza y marca notificaciones. `WorkspaceInviteDialog` está disponible para `OWNER/ADMIN` y la autorización efectiva permanece en backend.

## Interfaz

Las interfaces deben contemplar estados de carga, error, datos vacíos y éxito. `NotificationBell` muestra contador, panel reciente, marcado leído y `Review invitation`; presenta un resumen de pendientes una vez por pestaña y actualiza el badge nativo cuando está disponible. Logout elimina la caché por cuenta. La lógica de negocio y la autorización efectiva pertenecen al backend; el frontend solo adapta la presentación y la navegación.
