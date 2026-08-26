# Backend

## Stack

- Bun como runtime y gestor de dependencias.
- TypeScript.
- Hono para la API REST.
- Zod para validación mediante `@hono/zod-validator`.
- SQLite mediante `bun:sqlite` y Drizzle ORM (`DATABASE_URL=file:./data/momentum.db`, `PRAGMA journal_mode=WAL/foreign_keys/busy_timeout`).
- BullMQ con Redis y Nodemailer para el envío asíncrono de emails.
- Logger nativo por fecha, con persistencia opcional en `logs/YYYY-MM-DD.log` mediante `SHOW_LOGS`.

## Convención de idioma

El código fuente, identificadores, comentarios técnicos y respuestas de la API se escriben en inglés. La documentación del proyecto puede mantenerse en español.

## Organización

El backend utiliza una organización modular por dominio y endpoint. Actualmente implementa auth, workspaces e invitaciones mediante `modules/invitations/{create,accept,claim}`.

`modules/index.ts` monta los módulos principales con `app.route()`. Cada módulo puede montar sus endpoints relacionados y cada endpoint mantiene cerca su router, validación, lógica de negocio y tipos.

La raíz de cada módulo contiene únicamente `index.ts`, que compone sus routers. Cada endpoint usa, cuando son necesarios, `index.ts`, `schema.ts` y `service.ts`; los helpers reutilizables pertenecen a `src/utils/`.

Los servicios contienen lógica de negocio independiente de Hono y no importan `HTTPException`. El endpoint traduce los resultados de dominio a respuestas HTTP.

## Enfoque funcional

Los handlers HTTP se mantienen pequeños y no se utilizan controladores MVC ni clases propias por defecto. `service.ts` contiene funciones independientes del contexto HTTP. `schema.ts` define los schemas Zod y `types.ts` exporta tipos derivados o tipos de dominio reutilizables.

`app.ts` exporta la aplicación Hono para pruebas mediante `app.request()` con CORS multi-origen, `requestLogger` y `onError` (`ApiError`, `HTTPException` como fallback y `BAD_JSON`). `server.ts` inicia el servicio con `Bun.serve` (`HOST`/`PORT`). `modules/index.ts` monta `auth`, `invitations` y `workspaces`.

La validación JSON reutilizable se centraliza en `src/middleware/validation.ts` mediante `validateJson(schema)`. El middleware distingue `JSON_REQUIRED` (415), `EMPTY_JSON_BODY` (400), `BAD_JSON` (400) y `VALIDATION_ERROR` (400); las reglas de cada body permanecen en el `schema.ts` de su endpoint.

Los errores HTTP propios usan la fábrica funcional `src/errors/api-error.ts`: `createApiError` crea un `Error` reutilizable sin clases, `isApiError` lo identifica y `apiErrorBody` mantiene el payload `{ error: { code, message, details? } }`. Los servicios permanecen independientes de Hono y devuelven resultados de dominio.

## Observabilidad

La consola muestra siempre timestamp, nivel, método, ruta, status y duración. `SHOW_LOGS=true` habilita además `logs/YYYY-MM-DD.log`, que añade request bodies para `POST`/`PUT`/`PATCH` y response bodies para `GET`/`POST`/`PUT`/`PATCH`/`DELETE` cuando son JSON compacto en una sola línea (`Request body: {...}` / `Response body: {...}` + blank line entre requests). Con `SHOW_LOGS=false` (valor por defecto) no se crean archivos. Passwords, códigos, tokens, cookies, secrets y claves se redactan; los emails se enmascaran. Cada preview se limita a 4 KiB y se omiten bodies no JSON, SSE, JSON malformado o capturas superiores a 64 KiB. La decisión de persistir archivos es independiente de `NODE_ENV`.

La sanitización y el truncado tienen pruebas unitarias con `bun test`.

## Autenticación

Implementados `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me` (`requireAuth`) y `POST /api/v1/auth/verify-email`. El registro guarda el hash generado por `Bun.password`, genera un código alfanumérico de seis caracteres con validez de 24 horas, conserva solo su hash y encola el email mediante BullMQ. El worker integrado usa Nodemailer SMTP.

El login exige email verificado y crea una familia independiente por dispositivo. Emite un JWT HS256 `access_token` de 15 minutos y un refresh opaco rotatorio con expiración absoluta de siete días, ambos en cookies `HttpOnly`; SQLite conserva únicamente SHA-256 del refresh. `POST /auth/refresh` rota el token, mantiene la expiración original y responde `204`. Una reutilización fuera de la tolerancia de concurrencia revoca toda la familia. Logout revoca únicamente el dispositivo actual y elimina ambas cookies. `GET /me` retorna `200 {user}` o `401`. Middleware `requireAuth` acepta cookie `access_token` o `Bearer` y verifica `HS256` con `JWT_SECRET`.

La validación de `register` usa un contrato `VALIDATION_ERROR` con detalles por campo (`field` y `message`), sin exponer directamente la estructura interna de `ZodError`.

El registro exige una contraseña de 8-128 caracteres ASCII imprimibles con minúscula, mayúscula y carácter especial. Login mantiene mensajes genéricos para no revelar si un email existe o qué parte de las credenciales falló.

## Workspaces

`POST /api/v1/workspaces` (`requireAuth` + `validateJson` `name 3-50`, `description` omitida/`null` o string trim 5-1000 → `null` si no existe) → `201 {workspace}` y crea `membership` `OWNER`. Una descripción vacía, solo espacios o menor de cinco caracteres produce `400 VALIDATION_ERROR`. `GET /api/v1/workspaces` → lista filtrada por membresía y `deletedAt is null`. `GET /api/v1/workspaces/:id` → `200 {workspace+role}` o `404 WORKSPACE_NOT_FOUND`. `DELETE /api/v1/workspaces/:id` → hard delete permanente, solo para el `OWNER`, elimina primero invitaciones y memberships dentro de una transacción y devuelve `204`.

El hard delete es un endpoint backend-only y no tiene llamada, control ni flujo implementado en el frontend. Su carácter irreversible debe mantenerse explícito. El soft delete del MVP sigue pendiente y no puede reutilizar esta ruta sin una decisión posterior de contrato.

## Invitaciones

`POST /api/v1/workspaces/:id/invitations` permite invitar como `ADMIN` o `MEMBER` a emails registrados o no registrados y encola un email con token URL-safe de 32 bytes válido durante 7 días. Solo se almacena SHA-256. `POST /api/v1/invitations/accept` crea la membership para el usuario autenticado cuyo email coincide. `POST /api/v1/invitations/claim` crea atómicamente usuario verificado, membership, refresh y aceptación para destinatarios sin cuenta, e inicia su sesión; rechaza la reclamación si el navegador ya mantiene otra sesión refresh activa. No se crean usuarios provisionales al enviar invitaciones.

## Datos

SQLite es la fuente de verdad. Los IDs de `users`, `workspaces` e `invitations` usan CUID2 lowercase alfanumérico mediante `createId()` y se almacenan como `TEXT`; `memberships` usa `(userId, workspaceId)` como PK compuesta. Tablas implementadas: `users` (incluye estado y hash/expiración de verificación de email), `workspaces` (soft delete `deletedAt`, checks `name 3-50`, `description ≤1000`, indexes `ownerId/deletedAt`), `memberships` (PK compuesta, `role` check, indexes), `invitations` (tokenHash unique, expiración 7d, partial unique pendiente) y `refresh_tokens` (tokenHash como PK, familia CUID2 por dispositivo, expiración y revocación). Drizzle gestiona schema y migraciones versionadas. La base local debe sincronizarse antes de probar auth. Redis se usa para jobs temporales de BullMQ, nunca como fuente durable.
