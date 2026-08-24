# Frontend

## Stack

- Vue y TypeScript.
- Vite.
- pnpm.
- Vue Router.
- TanStack Vue Query.
- Pinia.
- Zod.
- Tailwind CSS.

## Estado

Momentum separa el estado según su naturaleza:

- TanStack Vue Query gestiona server state, caché, queries y mutations.
- Pinia gestiona estado global del cliente, como workspace seleccionado, preferencias, navegación y UI global.
- Vue local state gestiona estado efímero de componentes.

Pinia no sustituye a TanStack Vue Query ni funciona como caché manual de respuestas de la API.

## Interfaz

Las interfaces deben contemplar estados de carga, error, datos vacíos y éxito. La lógica de negocio y la autorización efectiva pertenecen al backend; el frontend solo adapta la presentación y la navegación.
