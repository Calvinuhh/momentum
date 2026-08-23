# Arquitectura

Momentum utiliza un único repositorio Git con dos aplicaciones independientes:

```text
momentum/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── api/
│       └── worker/
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
