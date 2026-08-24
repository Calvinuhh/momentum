# Backend

## Stack

- Bun como runtime y gestor de dependencias.
- TypeScript.
- Hono para la API REST.
- Zod y `@hono/zod-validator` para validación.
- SQLite mediante `bun:sqlite` y Drizzle ORM.
- BullMQ para procesamiento asíncrono.

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

`app.ts` exporta la aplicación Hono para pruebas mediante `app.request()`. `server.ts` inicia el servicio backend y arranca API y worker en el mismo proceso Bun.

## Procesos

La API y el worker pertenecen al mismo servicio y proceso:

- API expone la API REST bajo `/api/v1`.
- Worker consume jobs BullMQ y no necesita endpoint ni despliegue independiente en esta fase.

Ambos comparten el mismo archivo SQLite y el mismo build de Docker.

## Datos

SQLite es la fuente de verdad para los datos persistentes. Drizzle gestiona schema y migraciones versionadas. Redis se utiliza únicamente para colas y datos temporales apropiados.
