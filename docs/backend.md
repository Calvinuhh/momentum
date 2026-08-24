# Backend

## Stack

- Bun como runtime y gestor de dependencias.
- TypeScript.
- Hono para la API REST.
- Zod para validación mediante `@hono/zod-validator`.
- SQLite mediante `bun:sqlite` y Drizzle ORM (`DATABASE_URL=file:./data/momentum.db`, `PRAGMA journal_mode=WAL/foreign_keys/busy_timeout`).
- BullMQ para procesamiento asíncrono (previsto, aún no instalado).
- Logger nativo por fecha (`logs/YYYY-MM-DD.log`).

## Convención de idioma

El código fuente, identificadores, comentarios técnicos y respuestas de la API se escriben en inglés. La documentación del proyecto puede mantenerse en español.

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
│       ├── register/
│       │   ├── index.ts
│       │   ├── schema.ts
│       │   └── service.ts
│       ├── login/
│       │   ├── index.ts
│       │   ├── schema.ts
│       │   └── service.ts
│       ├── logout/
│       │   └── index.ts
│       └── reset-password/
├── middleware/
├── errors/
├── config/
├── db/
├── integrations/
├── queues/
└── worker/
```

`modules/index.ts` monta los módulos principales con `app.route()`. Cada módulo puede montar sus endpoints relacionados y cada endpoint mantiene cerca su router, validación, lógica de negocio y tipos.

El `index.ts` de la raíz de un módulo solo compone los routers de sus endpoints. Los archivos `schema.ts`, `service.ts` y `types.ts` pertenecen al directorio del endpoint y se crean únicamente cuando son necesarios.

Los servicios contienen lógica de negocio independiente de Hono y no importan `HTTPException`. El endpoint traduce los resultados de dominio a respuestas HTTP.

## Enfoque funcional

Los handlers HTTP se mantienen pequeños y no se utilizan controladores MVC ni clases propias por defecto. `service.ts` contiene funciones independientes del contexto HTTP. `schema.ts` define los schemas Zod y `types.ts` exporta tipos derivados o tipos de dominio reutilizables.

`app.ts` exporta la aplicación Hono para pruebas mediante `app.request()` con CORS multi-origen, `requestLogger` y `onError` (`ApiError`, `HTTPException` como fallback y `BAD_JSON`). `server.ts` inicia el servicio con `Bun.serve` (`HOST`/`PORT`). El worker BullMQ integrado está previsto pero aún no implementado.

La validación JSON reutilizable se centraliza en `src/middleware/validation.ts` mediante `validateJson(schema)`. El middleware distingue `JSON_REQUIRED` (415), `EMPTY_JSON_BODY` (400), `BAD_JSON` (400) y `VALIDATION_ERROR` (400); las reglas de cada body permanecen en el `schema.ts` de su endpoint.

Los errores HTTP propios usan la fábrica funcional `src/errors/api-error.ts`: `createApiError` crea un `Error` reutilizable sin clases, `isApiError` lo identifica y `apiErrorBody` mantiene el payload `{ error: { code, message, details? } }`. Los servicios permanecen independientes de Hono y devuelven resultados de dominio.

## Autenticación

Implementados `POST /api/v1/auth/register`, `POST /api/v1/auth/login` y `POST /api/v1/auth/logout`. El registro guarda el hash generado por `Bun.password` y devuelve únicamente el usuario público, sin emitir JWT. El login emite un JWT HS256 de siete días en la cookie `HttpOnly` `access_token`; logout elimina esa cookie. Los refresh tokens y la revocación server-side se implementarán posteriormente.

La validación de `register` usa un contrato `VALIDATION_ERROR` con detalles por campo (`field` y `message`), sin exponer directamente la estructura interna de `ZodError`.

El registro exige una contraseña de 8-128 caracteres ASCII imprimibles con minúscula, mayúscula y carácter especial. Login mantiene mensajes genéricos para no revelar si un email existe o qué parte de las credenciales falló.

## Procesos

La API y el worker pertenecerán al mismo servicio y proceso (previsto):

- API expone la API REST bajo `/api/v1` con `GET /api/v1/health`.
- Worker consumirá jobs BullMQ (previsto, aún no implementado) y no necesitará endpoint ni despliegue independiente.

Ambos compartirán el mismo archivo SQLite (`file:./data/momentum.db`) y el mismo build de Docker. Configuración validada con Zod en `src/config/env.ts` (`CORS_ORIGIN` lista por comas para DevTunnels).

## Datos

SQLite es la fuente de verdad para los datos persistentes. Drizzle gestiona schema y migraciones versionadas. Redis se utiliza únicamente para colas y datos temporales apropiados.
