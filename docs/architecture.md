# Arquitectura

Momentum utiliza un único repositorio Git con dos aplicaciones independientes, `frontend/` y `backend/`, cada una con sus propias dependencias, scripts y lockfile.

## Aplicaciones y procesos

- `frontend`: Vue 3.5 + Vite + Router (9 rutas, guard `auth/me` via Query), TanStack Query (server state) vs Pinia (selected workspace + auth efímero), Firebase Web con worker FCM compilado, Zod (`z.flattenError`), Tailwind `@theme` brand.
- `backend`: API REST Hono ejecutada con Bun y persistencia SQLite mediante Drizzle. Expone `/api/v1/auth/*` (+ `GET /me`), `/api/v1/workspaces` y `/api/v1/notifications` autenticado, aislado por usuario, con instalaciones FCM vinculadas a familias refresh.

Vite `build`/`type-check` son ejecutables; Docker placeholders siguen pendientes. El backend inicia en el mismo proceso un worker BullMQ que consume jobs desde Redis y envía emails mediante Nodemailer SMTP.

```text
API → BullMQ → Redis → worker integrado → Nodemailer → SMTP
  └──────────────────── SQLite (fuente de verdad)
```

## Organización

El backend se organiza por módulos y endpoints mediante composición de routers Hono. Los detalles están en [`backend.md`](backend.md). El frontend organiza `views` (9) + componentes + API + stores + schemas + composables + librerías de Query/Firebase; `main.ts` monta `Pinia` → `VueQueryPlugin` → `router` y `App.vue` (`AppHeader` + `RouterView`).

## Datos

Los datos persistentes se almacenan en SQLite mediante `bun:sqlite`. Drizzle gestiona el acceso normal y las migraciones versionadas.
