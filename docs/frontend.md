# Frontend

## Stack

- Vue 3.5 y TypeScript estricto + Vite + `@tailwindcss/vite` (`@import "tailwindcss"` + `@theme` brand `oklch`).
- pnpm, Vue Router (6 rutas, guard `auth/me`), TanStack Vue Query (`QueryClient` 30s stale), Pinia (auth efímero + `selectedWorkspaceId` persistido), Zod (`z.flattenError`), alias `@`.

## Estado

Momentum separa el estado según su naturaleza:

- TanStack Vue Query gestiona server state, caché, queries y mutations (`auth/me` desde el header y el guard, `workspaces` via `query` + `invalidateQueries`). La consulta de sesión usa `staleTime` de 5 minutos y no reintenta el `401` esperado.
- Pinia gestiona estado global del cliente, como workspace seleccionado (`localStorage momentum:workspaceId`), `user` efímero y UI global.
- Vue local state gestiona estado efímero de componentes (`useFormErrors`).

Pinia no sustituye a TanStack Vue Query ni funciona como caché manual de respuestas de la API.

## Rutas y vistas

- `/` landing Momentum (pública), `/register` y `/login` con validación `safeParse` + `z.flattenError` + `useFormErrors`, `/workspaces` y `/workspaces/:id` (`requiresAuth`, 4 estados loading/error/empty/success), `/:pathMatch(.*)*` 404. El header consulta `auth/me`: autenticado muestra `Workspaces` + `Log out`; anónimo muestra `Log in` + `Sign up`.

## API

- `fetch` wrapper `VITE_BACKEND_URL` + `credentials:include`, `ApiError` `{code,details}` y helper `fieldErrors`; `api/auth.ts` expone `getMe`, `GET /auth/me` se usa tanto por el header como por el guard.

## Interfaz

Las interfaces deben contemplar estados de carga, error, datos vacíos y éxito. La lógica de negocio y la autorización efectiva pertenecen al backend; el frontend solo adapta la presentación y la navegación.
