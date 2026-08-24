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
│       ├── middleware/   # requestLogger + logger por fecha
│       ├── config/       # env.ts Zod
│       ├── db/           # bun:sqlite + drizzle
│       ├── integrations/ # previsto
│       ├── queues/       # previsto
│       └── worker/       # previsto
│           └── processors/
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── docs/
└── README.md
```

## Aplicaciones y procesos

- `frontend`: aplicación Vue gestionada con pnpm.
- `backend`: API REST Hono y worker BullMQ ejecutados en el mismo proceso Bun.

La API y el worker pertenecen al mismo servicio y comparten el mismo archivo SQLite, dependencias y volumen persistente. Se inician de forma conjunta desde `server.ts` para simplificar despliegue y evitar compartir SQLite entre servicios independientes.

## Docker y Dokploy

Cada aplicación mantiene su propio `Dockerfile` y `.dockerignore`. Dokploy despliega dos servicios:

1. `frontend`, construido desde `frontend/`.
2. `backend`, construido desde `backend/` y ejecutado como un único proceso que levanta API y worker.

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

## Datos y despliegue

Los datos persistentes se almacenan en SQLite mediante `bun:sqlite`. El archivo SQLite vive en un volumen persistente del servicio `backend`, accesible tanto para la API como para el worker al ejecutarse en el mismo proceso. Redis Cloud se utiliza para colas y jobs programados.
