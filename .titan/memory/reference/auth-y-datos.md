# Auth, permisos y acceso a datos

## Quien es admin
- Fuente de verdad: `user.app_metadata.isAdmin` (Supabase Auth). La columna `profiles.is_admin` existe pero NO se usa.
- Se otorga con `POST /api/users/promote-user` (usa service role → `auth.admin.updateUserById`).
- Guards: `src/app/(admin)/layout.tsx` (`isAdmin` de `@/features/users/actions`) + cada route handler admin
  vuelve a comprobar `app_metadata.isAdmin`. Mantener ese doble chequeo en endpoints nuevos.

## Proteccion de rutas de cliente
- `src/app/middleware.ts` **no se ejecuta**: Next.js solo reconoce `middleware.ts` en la raiz o en `src/`.
- La proteccion real la hace cada pagina con `redirect()` (orders, setting/*). `/cart` y `/wish-list` soportan invitado.

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
