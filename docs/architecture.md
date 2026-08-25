# Arquitectura

Momentum utiliza un único repositorio Git con dos aplicaciones independientes, `frontend/` y `backend/`, cada una con sus propias dependencias, scripts y lockfile.

## Aplicaciones y procesos

- `frontend`: Vue 3.5 + Vite + Router (6 rutas, guard `auth/me` via Query), TanStack Query (server state) vs Pinia (selected workspace + auth efímero), Zod (`z.flattenError`), Tailwind `@theme` brand.
- `backend`: API REST Hono ejecutada con Bun y persistencia SQLite mediante Drizzle. Expone `/api/v1/auth/*` (+ `GET /me`) y `/api/v1/workspaces` (filtrado por `memberships` + soft delete, con `DELETE /:id` hard delete backend-only para `OWNER`).

Vite `build`/`type-check` son ejecutables; Docker placeholders siguen pendientes, al igual que el procesamiento asíncrono.

## Organización

El backend se organiza por módulos y endpoints mediante composición de routers Hono. Los detalles están en [`backend.md`](backend.md). El frontend organiza `views` (6) + `components/layout` + `components/workspaces` + `api` + `stores` + `schemas` + `composables` + `lib/queryClient`; `main.ts` monta `Pinia` → `VueQueryPlugin` → `router` y `App.vue` (`AppHeader` + `RouterView`).

## Datos

Los datos persistentes se almacenan en SQLite mediante `bun:sqlite`. Drizzle gestiona el acceso normal y las migraciones versionadas.
