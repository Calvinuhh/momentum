# Momentum

Momentum es un SaaS colaborativo de gestión de objetivos y tareas para usuarios individuales y equipos.

El proyecto está construido como un producto pequeño, pero con una arquitectura sólida y prácticas cercanas a un entorno real de producción.

## Documentación

La documentación técnica y de producto pública se organiza en [`docs/`](docs/). La arquitectura actual está descrita en [`docs/architecture.md`](docs/architecture.md), con detalles del [`backend`](docs/backend.md) y del [`frontend`](docs/frontend.md).

Las áreas principales del proyecto son:

- Producto y alcance.
- Arquitectura.
- Backend y API REST.
- Frontend.
- Persistencia y modelado de datos.
- Integraciones externas.
- Testing, seguridad, CI y despliegue.

La documentación se actualizará junto con la implementación de cada funcionalidad relevante.

## Convenciones del backend

- La raíz de cada módulo de `backend/src/modules/` contiene únicamente `index.ts`, que monta su router principal.
- Cada endpoint mantiene, cuando son necesarios, solo `index.ts`, `schema.ts` y `service.ts` en su propia carpeta.
- Los helpers reutilizables, como sesiones y tokens, pertenecen a `backend/src/utils/`; no deben colocarse en la raíz de un módulo ni dentro de una carpeta de endpoint.
- `CORS_ORIGIN` es la única variable de entorno para los orígenes del frontend y también se utiliza para construir enlaces enviados por email.
