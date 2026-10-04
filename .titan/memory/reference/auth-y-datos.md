# Auth, permisos y acceso a datos

## Quien es admin
- Fuente de verdad: `user.app_metadata.isAdmin` (Supabase Auth). La columna `profiles.is_admin` existe pero NO se usa.
- Se otorga con `POST /api/users/promote-user` (usa service role → `auth.admin.updateUserById`).
- Guards: layouts admin (`isAdmin` puro de `@/features/users/utils`) + cada route handler admin vuelve a comprobar
  `app_metadata.isAdmin`. **Server actions**: llamar `requireAdmin()` (`src/lib/supabase/requireAdmin.ts`) en la primera
  linea: son endpoints POST publicos (2026-10-04). No exportar funciones sincronas desde un modulo `"use server"`.
- `is_admin()` en SQL lee el JWT (`app_metadata.isAdmin`) desde 0018; `profiles.is_admin` no da permisos.

## Proteccion de rutas de cliente
- Desde 2026-10-04 `src/middleware.ts` solo **refresca la sesion** (se salta a invitados sin cookie `sb-*`). El viejo
  `src/app/middleware.ts` (que no se ejecutaba) se borro.
- La proteccion real la hace cada pagina con `redirect()` (orders, setting/*). `/cart` y `/wish-list` soportan invitado.
- `server.ts` ignora escrituras de cookies dentro de Server Components (antes: 500 con la sesion caducada).
- Perfiles: trigger en `auth.users` (0020) + `ensureProfile()` en checkout y direcciones.

## Clientes Supabase
- Server: `createClient({ cookieStore, isAdmin })` en `src/lib/supabase/server.ts`. Con `isAdmin: true` usa service role
  y NO adjunta cookies (si no, RLS sigue aplicando — causa historica de fallos al subir a Storage).
- Route handlers usan tambien `createRouteHandlerClient` de `@supabase/auth-helpers-nextjs` (lib legacy coexistiendo con `@supabase/ssr`).

## Lecturas vs escrituras
- **Lecturas** de catalogo/UI: GraphQL (pg_graphql) via urql. `makeClient` (anon + token usuario) en `src/lib/urql.ts`;
  `makeServiceClient` (service role, server-only) en `src/lib/urql-service.ts`.
  Tras cambiar queries → `npm run codegen`. pg_graphql limita a 30 filas por defecto; se subio a 1000 con `db:apply-graphql-limit`.
- **Escrituras** con logica (ordenes, stock): Drizzle en route handlers/actions, con transacciones.
- Server actions en dos sitios: `src/_actions/*` (legacy de Hiyori) y `src/features/*/actions.ts` (nuevo).

## Clientes con service role (leccion 2026-10-04)
- Supabase toma el rol de la cabecera `Authorization`, no de `apikey`. Un cliente "service role" que solo manda `apikey`
  corre como **anon**. `src/lib/urql-service.ts` y `scripts/fetchGraphQLSchema.js` mandan `Authorization: Bearer <service role>`.
- Desde 0018, anon no puede leer orders/order_lines/profiles/address: cualquier lectura de esas tablas va por Drizzle
  o por `getServiceClient()` (y solo desde paginas protegidas o filtrando por el usuario).

