# Arquitectura

Momentum utiliza un único repositorio Git con dos aplicaciones independientes, `frontend/` y `backend/`, cada una con sus propias dependencias, scripts y lockfile.

## Aplicaciones y procesos

- `frontend`: aplicación Vue gestionada con pnpm.
- `backend`: API REST Hono ejecutada con Bun y persistencia SQLite mediante Drizzle.

Existen placeholders Docker, pero todavía no hay una configuración ejecutable de construcción o despliegue. El procesamiento asíncrono tampoco está implementado.

## Organización del backend

El backend se organiza por módulos y endpoints mediante composición de routers Hono. Los handlers permanecen junto a sus rutas, la validación usa Zod y la lógica de negocio vive en funciones independientes de Hono. Los detalles están en [`backend.md`](backend.md).

## Datos

Los datos persistentes se almacenan en SQLite mediante `bun:sqlite`. Drizzle gestiona el acceso normal y las migraciones versionadas.
