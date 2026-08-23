# Frontend

## Stack

- React y TypeScript.
- Vite.
- pnpm.
- React Router.
- TanStack Query.
- Zustand.
- React Hook Form y Zod.
- Tailwind CSS.

## Estado

Momentum separa el estado según su naturaleza:

- TanStack Query gestiona server state, caché, queries y mutations.
- Zustand gestiona estado global del cliente, como workspace seleccionado, preferencias, navegación y UI global.
- React local state gestiona estado efímero de componentes.

Zustand no sustituye a TanStack Query ni funciona como caché manual de respuestas de la API.

## Interfaz

Las interfaces deben contemplar estados de carga, error, datos vacíos y éxito. La lógica de negocio y la autorización efectiva pertenecen al backend; el frontend solo adapta la presentación y la navegación.
