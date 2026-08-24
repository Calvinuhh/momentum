# Backend

## Stack

- Bun como runtime y gestor de dependencias.
- TypeScript.
- Hono para la API REST.
- Zod para validación (`@hono/zod-validator` previsto en fase auth).
- SQLite mediante `bun:sqlite` y Drizzle ORM (`DATABASE_URL=file:./data/momentum.db`, `PRAGMA journal_mode=WAL/foreign_keys/busy_timeout`).
- BullMQ para procesamiento asíncrono (previsto, aún no instalado).
- Logger nativo por fecha (`logs/YYYY-MM-DD.log`).

## Organización

El backend utiliza una organización modular por dominio y endpoint:

```text
src/
├── app.ts
├── server.ts
├── modules/
│   ├── index.ts
│   └── auth/
│       ├── index.ts
│       ├── login/
│       ├── logout/
│       └── reset-password/
├── middleware/
├── config/
├── db/
├── integrations/
├── queues/
└── worker/
```

`modules/index.ts` monta los módulos principales con `app.route()`. Cada módulo puede montar sus endpoints relacionados y cada endpoint mantiene cerca su router, validación, lógica de negocio y tipos.

## Enfoque funcional

Los handlers HTTP se mantienen pequeños y no se utilizan controladores MVC ni clases propias por defecto. `service.ts` contiene funciones independientes del contexto HTTP. `schema.ts` define los schemas Zod y `types.ts` exporta tipos derivados o tipos de dominio reutilizables.

`app.ts` exporta la aplicación Hono para pruebas mediante `app.request()` con CORS multi-origen, `requestLogger` y `onError` (`HTTPException`/`BAD_JSON`). `server.ts` inicia el servicio con `Bun.serve` (`HOST`/`PORT`). El worker BullMQ integrado está previsto pero aún no implementado.

## Procesos

La API y el worker pertenecerán al mismo servicio y proceso (previsto):

- API expone la API REST bajo `/api/v1` con `GET /api/v1/health`.
- Worker consumirá jobs BullMQ (previsto, aún no implementado) y no necesitará endpoint ni despliegue independiente.

Ambos compartirán el mismo archivo SQLite (`file:./data/momentum.db`) y el mismo build de Docker. Configuración validada con Zod en `src/config/env.ts` (`CORS_ORIGIN` lista por comas para DevTunnels).

## Datos

SQLite es la fuente de verdad para los datos persistentes. Drizzle gestiona schema y migraciones versionadas. Redis se utiliza únicamente para colas y datos temporales apropiados.
