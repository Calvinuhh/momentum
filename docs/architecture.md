# Arquitectura

Momentum utiliza un único repositorio Git con dos aplicaciones independientes:

```text
momentum/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── modules/
│       │   ├── index.ts
│       │   └── auth/
│       │       ├── index.ts
│       │       ├── login/
│       │       ├── logout/
│       │       └── reset-password/
│       ├── middleware/
│       ├── config/
│       ├── db/
│       ├── integrations/
│       ├── queues/
│       └── worker/
│           └── processors/
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── docs/
└── README.md
```

## Aplicaciones y procesos

- `frontend`: aplicación React gestionada con pnpm.
- `backend-api`: API REST Hono ejecutada con Bun.
- `backend-worker`: consumidor BullMQ ejecutado con Bun.

La API y el worker pertenecen al mismo package del backend y comparten código y dependencias. Se ejecutan como procesos independientes para que los jobs asíncronos no bloqueen ni afecten al ciclo de vida de la API.

El worker no es una API adicional ni necesita un dominio público.

## Docker y Dokploy

Cada aplicación mantiene su propio `Dockerfile` y `.dockerignore`. Dokploy despliega tres servicios:

1. `frontend`, construido desde `frontend/`.
2. `backend-api`, construido desde `backend/` y ejecutado con el entrypoint de la API.
3. `backend-worker`, construido desde `backend/` y ejecutado con el entrypoint del worker.

Los dos servicios del backend pueden utilizar la misma imagen y el mismo conjunto de dependencias. La diferencia se define mediante el comando de inicio, no mediante una segunda API o un tercer proyecto.

## Organización del backend

El backend se organiza por módulos y endpoints, siguiendo la composición de rutas de Hono con `app.route()`. Un módulo principal puede montar módulos de dominio como `auth`, y cada dominio puede contener sus endpoints:

```text
modules/
├── index.ts
└── auth/
    ├── index.ts
    └── login/
        ├── index.ts
        ├── schema.ts
        ├── service.ts
        └── types.ts
```

Los handlers HTTP permanecen junto a sus rutas. La validación se realiza con Zod, la lógica de negocio vive en funciones independientes y los tipos se derivan de los schemas cuando sea posible. No se utilizan controladores MVC ni clases propias por defecto.
