# QA-PILOTO-CUBA: Plan de correccion pre-piloto

> **Estado**: EN EJECUCION — Fase 0 y Fase 2 casi completas, desplegadas en `main` (2026-10-04). Fase 1 casi completa en la rama `fix/pilot-qa-p1` (sin commitear). Ver "Estado de ejecucion".
> **Fecha**: 2026-10-02
> **Proyecto**: Klau's Shop
> **Evidencia**: `.titan/qa/2026-10-02-piloto-cuba.md` · Datos QA creados: `.titan/qa/2026-10-02-datos-qa-ledger.jsonl`

---

## Estado de ejecucion (actualizado 2026-10-04)

Todo en `main`, desplegado en Vercel y verificado (dev :3001 contra la BD de prod, mas comprobaciones en produccion).
Los datos QA se borraron tras cada prueba; la BD coincide con la linea base.

| Bloque | Hecho | Pendiente |
|---|---|---|
| Fase 0 (bloqueantes) | P0-01, P0-02, P0-03, P0-04, P0-06, P0-07, P0-08, P0-11, P0-13; P0-10 (login/registro) y P0-12 en `fix/pilot-qa-p1` | P0-05 (OpenWA da 500 pero los mensajes llegan: aparcado por el dueño), P0-09 (Stripe dormido crea pedidos), P0-10 en reset-password y AccountClient |
| Envios (anexo A) | SN-01, SN-04, SN-05 (opcion A), SN-07 | SN-02, SN-03, SN-08, SN-09/10/11 |
| iPhone (anexo B) | IOS-01 (falta probar en iPhone fisico), IOS-02, IOS-03 | IOS-04..09 (bajos) |
| Admin movil (anexo C) | MPC-01..08, CSA-1..7 | MPC-09/10/11, CSA-8..10 (bajos/medios) |
| Fase 2 (refresco) | P2-01, P2-02, P2-03, P2-04, P2-06 | P2-05 (no reproducido), P2-07 |
| Fase 1 (rama `fix/pilot-qa-p1`) | P1-01..P1-14, P1-16 (solo el aviso "Hace N días"), P1-17. P1-10 ya venia de SN-05 | P1-15 (necesita migracion `unaccent` en prod), P1-16 TTL (decision del dueño), `drizzle/0022` sin aplicar |
| Fase 3, 4, 5 | — | todo |

**Migraciones aplicadas en prod:** 0018 (RLS, despues del deploy), 0019 (texto WhatsApp envio a acordar), 0020 (perfiles
al registrarse + backfill), 0021 (`orders.client_request_id`).

**Incidente:** tras aplicar 0018, `/admin/orders` dio 404 unos minutos: `urql-service.ts` solo enviaba `apiKey` y el
gateway lo trataba como anon. Arreglado con `Authorization: Bearer <service role>` (cbb7aa5).

---

## Objetivo

Dejar la tienda lista para el piloto en Cuba (Villa Clara). La venta por WhatsApp tiene que ser corta y sin friccion, los datos tienen que refrescarse bien (precio, stock, zonas, estado del pedido) y la app tiene que ser rapida y gastar pocos datos en 3G con cortes.

## Por que

| Problema | Solucion |
|----------|----------|
| Hay agujeros de seguridad: cualquiera puede leer o editar pedidos y modificar el catalogo sin sesion | Guard de admin en las server actions, limpiar RLS y revocar grants a anon |
| Los clientes registrados no pueden comprar (no se crea `profiles`) | Trigger que crea el perfil al registrarse, mas backfill |
| Las redes cubanas cortan respuestas y eso genera pedidos duplicados y reservas dobles | Idempotencia en el checkout (`client_request_id`) y copy de red en espanol |
| La ficha, las zonas y la lista admin muestran datos congelados (Data Cache de Next, 1 ano) | `dynamic`/`revalidate` + `revalidateTag` en las mutaciones |
| La primera visita baja ~650 KB de JS (~300 KB son de admin) | Separar los barrels admin/tienda, `sizes` en imagenes, cache de estaticos |

## Alcance probado

7 personas QA (cada hallazgo verificado por 2 revisores escepticos):
- **guest-mobile-buyer**: invitado, Pixel 5 emulado, 3G (400 ms, 50 KB/s), CPU x4.
- **registered-customer**: registro, login, direcciones, checkout logueado, pedidos, favoritos.
- **admin-orders**: ciclo de vida completo de pedidos, pedido manual, dashboard, export.
- **admin-catalog**: productos, colecciones, medias y frescura en la tienda.
- **integrity-api**: carreras de stock, manipulacion de payload, authz, RLS.
- **performance-connectivity**: build de produccion, bytes, hidratacion, offline.
- **code-audit-refresh**: auditoria de cache/refresco y verificacion en produccion (klau-shop.vercel.app).

**Entorno**: dev en `:3001`, build de produccion `next start` en `:3002` (worktree HEAD 2625165) y `https://klau-shop.vercel.app` (solo lectura, mas un cambio de precio a un producto QA). **La BD es la de PRODUCCION** (Supabase). WhatsApp de prueba solo a +5353077035.

**Resultado**: 123 hallazgos verificados, ninguno refutado, deduplicados en **71 items** por causa raiz:
**3 criticos · 21 altos · 28 medios · 19 bajos**.

---

## Resumen ejecutivo

1. **Seguridad (critico)**: las server actions de admin (`src/_actions/*`, `features/users/actions.ts`) se ejecutan **sin sesion**: se cambio el precio de un producto QA con un POST anonimo. Ademas, la RLS de `orders`/`order_lines`/`profiles` deja que **la anon key publica lea y modifique todos los pedidos** (nombre, telefono, direccion, importe, estado). Hay que arreglarlo antes de cualquier otra cosa.
2. **Clientes registrados bloqueados (critico)**: ningun usuario nuevo tiene fila en `profiles`, asi que guardar direccion y comprar logueado da 500 por FK. Afecta a la clienta real `elizabethjcb1998`.
3. **WhatsApp automatico caido (operativo)**: OpenWA responde 500 en el 100% de los envios (>130 seguidos). La sesion `robert-us` dice `ready` pero esta muerta. Nadie se entera, porque los errores se tragan.
4. **Venta en red inestable**: si se pierde la respuesta del checkout y el cliente reintenta, se crea un **pedido duplicado con reservas dobles**. El carrito del invitado **no se vacia** tras pedir, y con mas de 8 productos distintos **se omiten productos del pedido sin avisar**.
5. **Datos congelados**: la ficha de producto muestra precio y stock viejos para siempre (tambien en prod). `/api/shipping-zones` esta congelado desde el build (7 dias). La lista admin de pedidos mostraba 8 pedidos de hace una semana al navegar desde el menu.
6. **Consumo de datos**: unos 650 KB de JS por pagina de tienda, de los que ~300 KB son recharts/xlsx/quill/framer-motion de admin. La hidratacion en 3G tarda unos 23 s, y pulsar "Add to Cart" antes de eso recarga la pagina sin anadir nada.
7. **Friccion de cierre**: el cliente nunca ve el TOTAL antes de confirmar, el popup de WhatsApp se bloquea en iOS/3G y la confirmacion no ofrece boton, el telefono acepta numeros invalidos o con doble prefijo, y la zona arranca en "Otro / Envio por definir".
8. **iPhone y admin movil (anexos A, B y C)**: WhatsApp no se abre en iPhone tras pedir (IOS-01, critico). En el admin, el "clic fantasma" de Radix Select marca o desmarca checkboxes al elegir opciones con el dedo. La galeria de imagenes no cabe en pantalla, `<Input>` descarta `type` (las contraseñas se ven) y el formulario de coleccion se congela. Los pedidos sin envio funcionan, pero el total y los mensajes enganan.
9. **Lo que si funciona**: la integridad de stock en el checkout (FOR UPDATE, carreras de 10 peticiones → 1 pedido), los precios y el envio calculados en el servidor, las transiciones de estado, mark-paid/cancel y el dashboard (cuadra con SQL).

---

## Fases de correccion

Convenciones: `[ID(s)]` = hallazgos originales de esta QA · Sev = severidad calibrada · Esf = S/M/L.
Para BD: migracion Drizzle en `drizzle/` + `drizzle/rls_policies.sql`. Despues de cambiar el esquema: `npm run codegen:fetch && npm run codegen`.

### Fase 0 — Bloqueantes del piloto (dinero, stock, seguridad, venta rota)

- [x] **P0-01 · Server actions de admin sin autenticacion** — HECHO 2026-10-03 (rama `fix/pilot-qa-p0`): `requireAdmin()` en `src/lib/supabase/requireAdmin.ts`, `isAdmin` puro en `features/users/utils.ts`, `s3.ts` server-only, deleteOrderAction en tx y solo pending_confirmation/cancelled. Verificado: 4 actions anonimas → "No autorizado". · Sev **CRITICA** · Esf S
  `[ADMIN-CAT-01, ADMIN-ORD-03, CODE-01]`
  - **Donde**: `src/_actions/products.ts:19,63,140`, `src/_actions/collections.ts:12,31,52`, `src/_actions/orders.ts:11` (deleteOrderAction: borra orden, lineas y reservas sin transaccion), `src/features/users/actions.ts:70,83,103,131` (getUser, listUsers, createUser, deleteUserAction), `src/lib/s3.ts:1` (`'use server'` expone uploadImage/deleteImage).
  - **Causa**: los exports `'use server'` son endpoints POST publicos. Escriben con Drizzle (salta RLS) o con el service role, y no comprueban quien llama. El layout admin no protege las actions. Los IDs viajan en chunks publicos de la tienda por el barrel `@/features/products`.
  - **Fix**: crear un helper `requireAdmin()` (getCurrentUser + `app_metadata.isAdmin`, si falla `throw 'No autorizado.'`) y llamarlo en la primera linea de cada action mutante o de lectura de PII. Validar los argumentos con Zod. Quitar `'use server'` de `s3.ts` y poner `import 'server-only'`. deleteOrderAction: hacerla en `db.transaction` con lock, y permitir borrar solo pedidos cancelled o pending_confirmation.
  - **Verificar**: `curl -X POST http://localhost:3001/shop -H 'Next-Action: <id updateProductAction>' -H 'Content-Type: text/plain;charset=UTF-8' --data '["<id producto QA>",{...price:"999"}]'` sin cookies → error, y en BD el `price` no cambia. Repetir con deleteOrderAction usando un id inexistente: debe fallar por auth, no con "La orden no existe."

- [ ] **P0-02 · RLS de orders/order_lines/profiles abierta a anon** — CODIGO LISTO 2026-10-03: `drizzle/0018_lockdown_rls.sql` (probada con ROLLBACK: anon sin acceso, cliente solo lo suyo, admin todo) + `/admin/orders` con getServiceClient + `codegen:fetch` con service role. **PENDIENTE: aplicar 0018 en prod DESPUES de desplegar el codigo.** · Sev **CRITICA** · Esf S
  `[ADMIN-ORD-02, INTEGRITY-02, CODE-02]`
  - **Donde**: politicas en la BD de produccion que no estan en el repo (drift): `"Service role can manage all orders"` y `"... order_lines"` (ALL, TO public, true/true), `"Authenticated users can view all orders/order_lines"` (SELECT, public, true), `"Public read profiles"`. anon tiene grants INSERT/UPDATE/DELETE/TRUNCATE. La lista admin depende del agujero: `src/app/(admin)/admin/orders/page.tsx:33` usa `getClient()` sin token (anon).
  - **Impacto comprobado**: GET anon `/rest/v1/orders` devolvio 62 pedidos con telefono. Un PATCH anon dio 200 (el pedido QA `w28ckd62u1lq1a8a4dlo3x96` quedo con amount 1.00). Con un UPDATE de `order_status` se puede marcar como `paid` sin descontar stock y disparar WhatsApp a cualquier numero.
  - **Fix (EN ESTE ORDEN)**:
    1. Pasar `admin/orders/page.tsx:33`, y cualquier otra lectura admin con `getClient()` sobre orders/profiles, a `getServiceClient()` o Drizzle.
    2. `DROP POLICY` de las 4 politicas "Service role…"/"Authenticated users can view all…".
    3. Restringir profiles a dueno o admin.
    4. `REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON orders, order_lines, profiles, products FROM anon` (y UPDATE/DELETE de authenticated en orders/order_lines).
    5. Volcar el estado real en `drizzle/rls_policies.sql`.
    6. Auditar el resto de tablas: `select tablename,policyname,roles,qual from pg_policies where qual='true' or with_check='true'`.
  - **Verificar**: con la anon key, `GET /rest/v1/orders` → `[]`/`*/0`, `PATCH` → 0 filas, `GET /rest/v1/profiles` sin emails. `/admin/orders` como admin sigue listando todo. `/orders` del cliente solo muestra los suyos. Checkout invitado → 201.

- [ ] **P0-03 · Escalada latente via `profiles.is_admin`** — CODIGO LISTO en 0018 (`is_admin()` por JWT, UPDATE solo name/phone) + `rls_policies.sql` corregido. Pendiente aplicar 0018. · Sev ALTA · Esf S · **hacer ANTES de P0-04**
  `[INTEGRITY-03]`
  - **Donde**: `public.is_admin()` lee `profiles.is_admin`. La politica "Users update own profile" no restringe columnas. authenticated (y anon) tiene UPDATE sobre `is_admin`. `drizzle/rls_policies.sql:31-33` define una politica de self-INSERT que **no** esta en vivo: ejecutar `npm run db:apply-rls` tal cual armaria la escalada.
  - **Fix**: `is_admin()` → `select coalesce((auth.jwt()->'app_metadata'->>'isAdmin')::boolean,false)`. `REVOKE UPDATE, INSERT ON profiles FROM authenticated, anon; GRANT UPDATE (name, phone) ON profiles TO authenticated`. Corregir `rls_policies.sql`.
  - **Verificar** (transaccion con ROLLBACK): `set local role authenticated` + claims de un usuario QA → `update profiles set is_admin=true where id=me` falla o no cambia `is_admin()`.

- [ ] **P0-04 · Los usuarios nuevos no tienen `profiles`: no pueden comprar ni guardar direcciones** · Sev **CRITICA** · Esf S
  `[REG-01, INTEGRITY-01]`
  - **Donde**: FKs `orders_user_id_profiles_id_fk` y `address_userProfileId_profiles_id_fk`. Insert en `src/app/api/checkout/whatsapp/route.ts:97-114` y `src/app/api/addresses/route.ts:91-100`. No hay trigger en `auth.users` ni ningun insert en profiles en el codigo.
  - **Estado BD**: 9 de 14 auth.users sin perfil, entre ellos `elizabethjcb1998` (clienta real) y `robert.cabrer92`. Los perfiles QA existentes se crearon a mano.
  - **Fix**: migracion `0018_profiles_on_signup`: funcion SECURITY DEFINER (`set search_path=''`) + trigger AFTER INSERT ON auth.users → `insert into public.profiles(id,email,name) values (new.id,new.email,new.raw_user_meta_data->>'name') on conflict do nothing`, mas backfill de los auth.users sin perfil. Como red de seguridad, upsert `onConflictDoNothing` del perfil dentro de la tx del checkout y en POST /api/addresses. No devolver `error.message` de Postgres al cliente (mensaje generico en espanol).
  - **Verificar**: crear un usuario QA por la admin API → existe su fila en profiles. Logueado: POST /api/addresses → 201 y POST /api/checkout/whatsapp → 201 con `user_id` puesto. `select count(*) from auth.users u left join profiles p on p.id=u.id where p.id is null` = 0.

- [ ] **P0-05 · WhatsApp automatico (OpenWA) caido y sin monitoreo** · Sev ALTA (bloqueante operativo) · Esf S (ops) + M (monitor)
  `[GUEST-02, REG-05, ADMIN-ORD-01, INTEGRITY-06]`
  - **Donde**: `public.send_wa()` → `net.http_post` a OpenWA `/sessions/<sid>/messages/send-text`. Los triggers `wa_notify_new_order` y `wa_notify_order_status`. `EXCEPTION … RAISE WARNING` se traga el fallo y `net._http_response` solo guarda ~6 h.
  - **Causa**: es externa. La sesion `robert-us` (host compartido alucard-openws.duckdns.org) reporta `ready` pero `lastActive` esta congelado en 2026-10-01 18:45Z, y todos los send-text dan 500. El SQL de la app esta bien (chatId `5353077035@c.us`, cabeceras correctas; una key erronea da 401).
  - **Fix**:
    1. **Ops ya**: reconectar o reescanear la sesion y probar un send-text directo a +5353077035 hasta obtener 2xx. No fiarse del estado `ready`.
    2. **Monitor**: job (pg_cron o un chequeo en el dashboard admin) que cuente las filas no-2xx de `net._http_response` en la ultima hora y muestre el banner "WhatsApp automatico caido".
    3. Opcional: tabla `wa_outbox` con estado por pedido, reintentos y boton "reenviar / abrir wa.me" en el detalle admin.
    4. Pedir una API key de OpenWA limitada a esta sesion (hoy la key da acceso tambien a `vitis-bot`).
  - **Verificar**: crear un pedido QA → `select status_code from net._http_response order by created desc limit 3` → 200/201 y el mensaje llega a +5353077035.

- [x] **P0-06 · Checkout sin idempotencia: pedidos duplicados al reintentar** — HECHO 2026-10-04: `orders.client_request_id` unico (0021, APLICADA en prod), id por intento ligado al carrito (sessionStorage + memoria), replay devuelve el mismo pedido (200) tambien en carrera (23505); toast "Sin conexion" sin mensaje crudo. Verificado: respuesta perdida + reintento → 1 pedido y 1 reserva; 6 peticiones concurrentes → 1 pedido. Pendiente: la orden manual del admin (doble clic) no es idempotente. · Sev ALTA · Esf M
  `[GUEST-01, PERF-05, INTEGRITY-05, REG-10, CODE-08]`
  - **Donde**: `src/app/api/checkout/whatsapp/route.ts:21-146` (cada POST inserta pedido, lineas y reservas). `src/features/orders/components/WhatsAppCheckoutButton.tsx:211-273` (sin clave; muestra `error.message` crudo; `response.json()` sin proteger en :225).
  - **Evidencia**: pares duplicados `kk49…/iqkm…`, `fqir…/nemx…`, `bazj…/ak5l…` y `e7xy…/x0az…`, cada uno con reservas activas. Un tercer intento dio 409 porque los duplicados agotaron el stock.
  - **Fix**: el cliente genera `checkoutId = crypto.randomUUID()` al abrir el dialogo, lo guarda en sessionStorage hasta que hay exito y lo reutiliza en cada reintento. Columna `orders.client_request_id text unique` (migracion + Zod opcional). En la tx: si ya existe, devolver 200 con el mismo `{orderId, orderNumber, whatsappUrl}`; tambien si salta la violacion 23505. En el cliente: `TypeError`/`!navigator.onLine`/respuesta no-JSON → "Sin conexion. Es posible que tu pedido se haya creado; pulsa de nuevo, no se duplicara." (nunca `error.message`). Opcional: limite por telefono (>3 pedidos en 10 min → 429).
  - **Verificar**: Playwright con `route.fetch()` + `abort('connectionreset')` en el primer POST y luego un reintento → **1** pedido en BD y 1 juego de reservas. Dos POST identicos con el mismo `client_request_id` → mismo orderId.

- [x] **P0-07 · El carrito del invitado no se vacia tras pedir** — HECHO 2026-10-04: `removeAllProducts()` + `router.replace`. Nota: `persist-and-sync` escribe la cookie `cart` sin `path=/` (queda una copia vieja por ruta, p.ej. `/shop`). No se lee (gana localStorage), pero viaja en cada peticion; baja prioridad. · Sev ALTA · Esf S
  `[GUEST-03, CODE-05]`
  - **Donde**: `WhatsAppCheckoutButton.tsx:242-257` (solo `cart-updated` + `router.push`). `src/features/carts/useCartStore.ts:73` (`removeAllProducts` solo se llama en AuthProvider). El servidor solo vacia el carrito BD si `user?.id` (route.ts:180-189).
  - **Fix**: tras `response.ok`, `useCartStore.getState().removeAllProducts()` (importar de `@/features/carts/useCartStore`, no de `hooks/useCartStore.ts`) y despues `router.replace` (no push) a `/orders/confirmation`. Opcional: vaciarlo tambien en la confirmacion si llega `orderId`.
  - **Verificar**: invitado → pedido → la cookie y el localStorage `cart` quedan `{}`, Atras no muestra el carrito lleno y `/cart` dice "vacio".

- [x] **P0-08 · Con mas de 8 productos distintos, el resto se omite del pedido** — HECHO 2026-10-04: `first: productIds.length`; verificado con 10 productos → 10 lineas en el payload. · Sev ALTA · Esf S
  `[GUEST-04, CODE-24]`
  - **Donde**: `src/features/carts/components/GuestCartSection.tsx:51` (`first: 8`). La UI, el subtotal y el payload del checkout salen de `data.edges` (:144-189). El servidor confia en `cartItems`.
  - **Fix**: `first: productIds.length` (pg_graphql max_rows=1000). Construir el payload del checkout desde el store, no desde la query. Si faltan ids (borrados o inactivos), quitarlos del store y mostrar un toast en espanol. Revisar tambien `orders/page.tsx:36` (`first: 8`).
  - **Verificar**: cookie con 10 ids → 10 lineas, subtotal completo y POST con 10 `cartItems`.

- [ ] **P0-09 · `/api/create-checkout-session` (Stripe dormido) crea pedidos basura anonimos** · Sev ALTA · Esf S
  `[INTEGRITY-07]`
  - **Donde**: `src/app/api/create-checkout-session/route.ts:35` (`if (!validation)` siempre es falso) y :47-68 (insert sin tx ni stock, antes de Stripe).
  - **Evidencia**: pedidos `pf6fm65w…` (amount -260, linea qty -2), `at4hxove…` (huerfano sin lineas) y `jx7m1co7…`; cada uno disparo WhatsApp al admin.
  - **Fix**: devolver 410 de inmediato (o borrar la ruta junto con `CheckoutButton.tsx`) mientras Stripe siga apagado. Revisar `webhook` igual.
  - **Verificar**: POST anonimo → 410 y 0 pedidos nuevos.

- [ ] **P0-10 · El login envia la contrasena en la URL si se pulsa antes de hidratar** · Sev ALTA · Esf S
  `[ADMIN-ORD-10, ADMIN-CAT-03]`
  - **Donde**: `src/features/auth/components/SigninForm.tsx:69-72`, `SignupForm.tsx:75-78`, formularios de reset (`src/app/(auth)/sign-in/reset-password/page.tsx:145,165`) y `AccountClient.tsx:229`.
  - **Fix**: boton deshabilitado hasta el montaje (`useEffect(()=>setReady(true))`, `disabled={!ready||isPending}`) mas `method="post"`. Quitar `console.log("data", data)` en `SigninForm.tsx:56` (imprime tokens).
  - **Verificar**: Playwright con chunks bloqueados o 3G, rellenar y pulsar Enter → la URL no contiene `password=`.

- [x] **P0-11 · Sesion expirada (>1 h): 500 en la primera carga (HECHO 2026-10-04: try/catch en server.ts + src/middleware.ts que solo refresca la sesion y se salta a invitados; reproducido 500 → 200 en /, /orders, /admin/orders) (home, /orders, /admin, enlace /order/:id)** · Sev ALTA · Esf S
  `[ADMIN-ORD-04, CODE-13]`
  - **Donde**: `src/app/middleware.ts` no se ejecuta (ubicacion invalida; `middleware-manifest` vacio). `src/lib/supabase/server.ts:57-62` llama a `cookieStore.set/remove` sin try/catch dentro de un RSC.
  - **Fix**:
    1. try/catch en set/remove de `server.ts`; esto solo ya quita el 500.
    2. Crear `src/middleware.ts` con `updateSession` de @supabase/ssr. **No moverlo tal cual**: proteger solo `/setting` y `/orders` (excluyendo `/orders/confirmation`), nunca `/cart` ni `/wish-list`. El matcher debe excluir `_next/static`, `_next/image`, imagenes y `/api`. Saltar `getUser()` si no hay cookie `sb-*`.
    3. Opcional: `src/app/error.tsx` en espanol con "Reintentar".
  - **Verificar**: reescribir `expires_at` de la cookie sb al pasado y pedir `/`, `/orders`, `/admin/orders` y `/order/<id>` → 200/redirect, nunca 500. Como invitado, `/cart` y `/orders/confirmation` → 200.

- [ ] **P0-12 · Detalle de pedido de invitado visible para cualquier logueado** · Sev MEDIA · Esf S
  `[REG-02, CODE-18]`
  - **Donde**: `src/app/(store)/orders/[orderId]/page.tsx:58` (`if (order.user_id && …)` deja pasar `user_id` null; 58 de 62 pedidos son de invitado).
  - **Fix**: `if (order.user_id !== user.id && !user.app_metadata?.isAdmin) notFound()`, igual que el redirector `/order/[orderId]`.
  - **Verificar**: cliente QA → `/orders/<pedido invitado>` → 404.

- [x] **P0-13 · Limpieza de datos QA en produccion** — HECHO 2026-10-03: borrado por diff contra baseline (54 pedidos, 24 productos, 14 usuarios, 1 coleccion, 2 zonas, 8 medias + objetos de Storage). BD = baseline. · Esf S
  - Ledger: `.titan/qa/2026-10-02-datos-qa-ledger.jsonl` (52 pedidos, 20 productos, 12 auth users, 1 coleccion `qaAdminCatalogColl01`, 2 zonas, 8 medias, 4 perfiles…).
  - Cancelar los pedidos QA activos via `/api/admin/orders/[id]/cancel` para liberar reservas. **No** usar deleteOrderAction mientras no se arregle P0-01.
  - Ocultar o borrar la coleccion QA, que **hoy se ve en el footer de produccion** (ADMIN-CAT-08). Borrar productos, usuarios y medias QA.
  - El pedido `w28ckd62u1lq1a8a4dlo3x96` quedo con amount 1.00 y nombre "(editado por anon)".
  - **Verificar**: `select count(*) from orders where name ilike 'QA%' and order_status not in ('cancelled')` = 0. Ninguna coleccion ni producto QA en el menu ni en /shop.

### Fase 1 — Friccion en la venta

> **Ejecucion 2026-10-04 (rama `fix/pilot-qa-p1`, sin commitear).** Verificado en dev :3001 contra la BD de prod **sin escribir**:
> errores del checkout (400 JSON/telefono, 409 PRODUCT_NOT_FOUND/INSUFFICIENT_STOCK en español, 0 pedidos creados), dialogo de
> invitado en 390 px (total antes de confirmar, `+5353077035` → `+53 53077035`, `1234` → error, 1 sola peticion de zonas),
> confirmacion de invitado sin "Ver mis ordenes", `/order/x` → `/sign-in?redirect=/order/x`, login con error en español sin password
> en la URL, invitado sin peticiones a `/auth/v1/user`, filtro de precio sin cotas (pg_graphql OK). Tests: 20 de `src/lib/phone.ts`.
> **Sin verificar** (requieren usuario logueado y escribir en prod): fusion del carrito al iniciar sesion (P1-07), P1-11, P1-12.
> `document is not defined` en consola al hidratar ya ocurre en `main` (no es de esta rama).
> Piezas nuevas: `src/lib/phone.ts` (schema compartido + normalizacion), `src/lib/safeRedirect.ts`, `OrderTotalSummary`,
> `features/orders/utils/checkoutErrors.ts`, errores tipados `OutOfStockError`/`ProductNotFoundError` en `inventory.ts`.
> `drizzle/0022_wa_admin_order_url_redirector.sql` (enlace admin → `/order/{id}`) **sin aplicar**.

- [ ] **P1-01 · Telefono: acepta 4 digitos y genera doble prefijo `+53 5353077035`** · Sev ALTA · Esf S
  `[GUEST-05]` (+ `GUEST-23` carrera de efectos, baja)
  - **Donde**: `src/features/orders/validations/index.ts:9-15` (`min(8)` sobre "+53 " + numero). `src/components/forms/PhoneInputField.tsx:63-110` (se descarta el `+`, no se quita el 53) y :143-156 (dos efectos que se pisan, "Maximum update depth").
  - **Fix**: superRefine sobre los digitos nacionales: CU `^[56]\d{7}$`, otros paises 6-12 digitos, mensaje "Numero invalido: en Cuba son 8 digitos (ej. 5XXXXXXX)". Si el pais es CU y hay 10 digitos que empiezan por 53, quitar el 53. Mantener el `+` parcial. Una sola fuente de estado (componer en onChange; re-sembrar solo si `field.value` ≠ ultimo valor emitido). Normalizar a E.164 en el servidor (checkout y admin create). El schema compartido cubre el checkout, AddressForm y AdminOrderCreateForm.
  - **Verificar**: teclear `1234` → error; `5353077035`, `+5353077035` (tecla a tecla) y `+53 5307 7035` → `+53 53077035`; teclear a 0 ms de retardo no pierde digitos. SQL `wa_phone_to_chat_id(phone)` = `5353077035@c.us`.

- [ ] **P1-02 · WhatsApp del cliente: popup bloqueado y confirmacion sin boton** · Sev ALTA · Esf S
  `[GUEST-14, INTEGRITY-11, CODE-07]`
  - **Donde**: `WhatsAppCheckoutButton.tsx:255-262` (`window.open` en setTimeout 1500 tras un await: Safari lo bloquea siempre y Chrome si pasan >5 s). `src/app/(store)/orders/confirmation/page.tsx:89-110` (sin enlace ni telefono; "Hemos enviado tu pedido…" es falso si OpenWA falla; "Ver mis ordenes" manda al invitado a /sign-in).
  - **Fix**: guardar `whatsappUrl` en sessionStorage por orderId, o regenerarla en el servidor. En la confirmacion, boton grande `<a href>` "Enviar pedido por WhatsApp", con fallback `wa.me/${siteConfig.whatsappPhone}?text=Pedido KS-XXXX` y el numero visible. Quitar el popup diferido o usar `window.location.href`. Cambiar el copy a "Envia tu pedido por WhatsApp para confirmarlo". Para invitados, ocultar "Ver mis ordenes". Patron ya existente en `AdminOrderCreateForm.tsx:583`.
  - **Verificar**: en WebKit o con el popup bloqueado, la confirmacion muestra el boton y abre `api.whatsapp.com/send?...` con el texto del pedido.

- [ ] **P1-03 · El cliente no ve el TOTAL (subtotal + envio) antes de confirmar; redondeo distinto al del servidor** · Sev MEDIA · Esf S
  `[GUEST-08, REG-12]`
  - **Donde**: `WhatsAppCheckoutButton.tsx:38-42` (sin precios), `ShippingZoneSelect.tsx:131-137`, `GuestCartSection.tsx:233-258`, `UserCartSection.tsx:77-85` y `CartItemCard.tsx:70-71` (sin redondeo por unidad, frente a `pricing.ts:6-17`).
  - **Fix**: subtotal con `getDiscountedUnitPrice` en ambos carritos; pasar `subtotal` al boton. Resumen Subtotal / Envio (zona) / **Total** encima del boton de enviar (invitado y direccion guardada), o "Total: X CUP + envio por definir". Reutilizar el markup de AdminOrderCreateForm. Opcional: total en la confirmacion.
  - **Verificar**: carrito con 3 × 999.99 al -33% → el carrito, el dialogo, el pedido y el WhatsApp muestran el mismo total (7309.97 con envio de 200).

- [ ] **P1-04 · La zona arranca en "Otro / Envio por definir" y las zonas se piden 2-3 veces sin cache** · Sev MEDIA · Esf S
  `[GUEST-09, REG-16, GUEST-10]`
  - **Donde**: `src/features/shipping/components/ShippingZoneSelect.tsx:41` (`useState(OTHER_VALUE)`) y :47-68, :111-128. `src/features/shipping/hooks/useShippingZones.ts:9-31` (`isLoading=false` inicial, sin cache, sin estado de error, sin `res.ok`). Doble consumidor: `WhatsAppCheckoutButton.tsx:76` + ShippingZoneSelect.
  - **Fix**: `useState(value.zoneId ?? (value.zoneName ? OTHER_VALUE : ""))` (placeholder "Selecciona tu zona"). Mostrar el input y el aviso de "Otro" solo si se elige explicitamente y no esta cargando. Mientras carga: "Cargando zonas…" o el nombre guardado. Cache compartida: promesa a nivel de modulo + localStorage con TTL (5 zonas ≈ 431 B). Exponer `{zones,isLoading,error,retry}` con boton "Reintentar". Zonas de Santa Clara primero (columna `sort_order` o regla).
  - **Verificar**: con /api/shipping-zones retrasado 6 s o abortado, el invitado que vuelve ve su zona y su costo (desde la cache) y el nuevo ve el placeholder. 1 sola peticion por sesion.

- [ ] **P1-05 · Errores de red y de stock en ingles o crudos ("Failed to fetch", "OUT_OF_STOCK: …")** · Sev MEDIA · Esf S
  `[GUEST-11, INTEGRITY-10]` (+ `INTEGRITY-09` producto inexistente → 500, baja)
  - **Donde**: `WhatsAppCheckoutButton.tsx:225-239, 263-270`. `src/features/orders/utils/inventory.ts:77-79`. `route.ts:23,66-74,208-224` (JSON invalido → 500; producto inexistente → 500 con el id). Lo mismo en `admin/orders/create/route.ts:190`.
  - **Fix**: error tipado `OutOfStockError` → 409 `{error:'INSUFFICIENT_STOCK', items:[{productId,name,available,requested}]}`. El cliente muestra "Solo quedan N de X" con la accion "Ajustar carrito". Producto inexistente → 409 `PRODUCT_NOT_FOUND` + quitarlo del carrito. JSON invalido → 400. `productId: z.string().min(1)`. Los 500 llevan un mensaje generico en espanol.
  - **Verificar**: offline → "Sin conexion…"; 409 de stock → copy en espanol y la cantidad se ajusta.

- [ ] **P1-06 · "Add to Cart" antes de hidratar recarga la pagina sin anadir** · Sev ALTA · Esf S
  `[PERF-03]`
  - **Donde**: `src/features/carts/components/AddProductToCartForm.tsx:121` (form sin action) y :194-200 (submit habilitado en SSR para los 39 productos sin variantes).
  - **Fix**: `disabled={!mounted || …}` con la etiqueta "Cargando…". Traducir "Anadir al carrito"/"Cantidad". El arreglo real de la ventana es P3-01 (menos JS).
  - **Verificar**: en 3G, pulsar a los ~1 s no navega a `?quantity=1`.

- [ ] **P1-07 · El carrito de invitado se pierde al iniciar sesion (merge 400 PGRST204)** · Sev ALTA · Esf M
  `[REG-04, CODE-06]`
  - **Donde**: `src/providers/AuthProvider.tsx:60-84` (camelCase `productId/userId`, clave compuesta usada como id, descarta variantes, `JSON.parse(null)`, ignora el error, no limpia).
  - **Fix**: leer `useCartStore.getState().cart`; separar `productId` de la clave (cuid2 no lleva '-') o guardar `productId` en el item. Mapear a `{product_id,user_id,quantity,color,size,material}` y sumar cantidades si ya existe la combinacion (helpers de `carts/api.ts`). Solo si todo va bien: `removeAllProducts()` + `cart-updated`. try/catch con un toast en espanol si falla. Idempotente ante SIGNED_IN repetidos (se dispara al volver el foco a la pestana).
  - **Verificar**: invitado anade lego-250 → /sign-in?from=/cart → /cart muestra el producto. La BD `carts` tiene la fila con variante. El localStorage queda vacio.

- [ ] **P1-08 · La UI trata al logueado como invitado hasta que responde `getUser()`; 403 inutil para invitados; re-SIGNED_IN al volver el foco** · Sev ALTA · Esf S
  `[REG-06, GUEST-20, PERF-14 (auth)]` (relacionado con P2-05)
  - **Donde**: `src/providers/AuthProvider.tsx:42-50, 55-62, 116-129`. gotrue-js 2.62.2 hace GET `/auth/v1/user` aunque no haya sesion (403).
  - **Fix**: `setUser(session?.user ?? null)` sincrono en todos los eventos. Validar en segundo plano solo si hay sesion, y solo sobrescribir el usuario ante un 401/403 real (nunca ante un error de red). Si no hay sesion, no llamar a getUser. Exponer `isLoading`. Ejecutar los efectos de SIGNED_IN (toast, sync) solo en un login real (antes no habia usuario). `prefetch={false}` en el Link `/sign-in` (`UserNav.tsx:111`).
  - **Verificar**: con `/auth/v1/user` retrasado o abortado, `/wish-list` y el header muestran al usuario. El invitado no hace la peticion 403. Volver el foco a la pestana no repite el toast "¡Bienvenido de nuevo!".

- [ ] **P1-09 · Enlace `/order/:id` manda a cualquier cliente a /admin → portada; ?redirect ignorado tras login** · Sev ALTA · Esf S
  `[REG-03, GUEST-21, ADMIN-ORD-09, CODE-14]` (+ parte de `REG-11`)
  - **Donde**: `src/features/users/actions.ts:1,39-40` (`isAdmin` sincrono exportado desde un modulo `'use server'` → Promise siempre truthy). Lo usan `src/app/order/[orderId]/page.tsx:30` y `src/app/(admin)/layout.tsx:12` (guard inutil). `page.tsx:17` envia `?redirect=` y `SigninForm.tsx:62`/`SignupForm.tsx:56` leen `?from=`. `(admin)/admin/layout.tsx:23` y `/orders`, `/setting/*` redirigen sin ruta de vuelta. OAuth no pasa `next`. Hay copy en ingles en `(admin)/layout.tsx:13`.
  - **Fix**: mover `isAdmin` a `src/features/users/utils.ts` (puro). Leer `redirect ?? from`, aceptando solo valores que empiecen por `/` y no por `//`. Anadir `?redirect=<path>` a todos los `redirect('/sign-in')`. Que `wa_admin_order_url` apunte a `/order/{id}`. OAuth con `auth/callback?next=`. Traducir el copy.
  - **Verificar**: cliente dueno → `/order/<id>` → `/orders/<id>`; otro cliente → 404; sin sesion → login → vuelve al pedido; el admin → `/admin/orders/<id>`.

- [ ] **P1-10 · Confirmar un pedido con envio "Por definir": el WhatsApp dice "Total a pagar" sin el envio; fijarlo despues no avisa** · Sev ALTA · Esf S
  `[ADMIN-ORD-12]`
  - **Donde**: `src/app/api/admin/orders/[orderId]/change-status/route.ts:81-108`; la rama `pending_payment` de `wa_notify_order_status`; `update-shipping/route.ts:42-72`.
  - **Fix**: rechazar `pending_payment` si `shipping_cost IS NULL` ("Define el costo de envio antes de confirmar"), o pedir el costo en el mismo paso de confirmar. En el SQL, anadir la linea `*Envio:* coalesce(wa_money(NEW.shipping_cost),'por definir')`.
  - **Verificar**: un pedido con zona "Otro" no se puede confirmar sin costo; el mensaje incluye el envio.

- [ ] **P1-11 · Checkout logueado sin salida si ninguna direccion es predeterminada** · Sev MEDIA · Esf S
  `[REG-07]`
  - **Donde**: `WhatsAppCheckoutButton.tsx:104-110`, `AddressSelector.tsx:29-31`.
  - **Fix**: `const initial = loaded.find(a=>a.isDefault) ?? loaded[0]; if (initial) setSelectedAddress(initial)`.
  - **Verificar**: una sola direccion no predeterminada → aparece "Continuar con esta direccion".

- [ ] **P1-12 · El checkout del registrado sin direcciones pide 7 controles y no precarga nada** · Sev MEDIA · Esf S
  `[REG-09]`
  - **Donde**: `AddressSelector.tsx:46-52`, `AddressForm.tsx:52-71,170-190`, `addresses/validations/index.ts:5-8`.
  - **Fix**: prop `checkout` en AddressForm con alias opcional (por defecto "Principal"), `recipientName` desde `user_metadata.name`, telefono de `profiles.phone` si existe, y sin el checkbox de predeterminada en la primera direccion.
  - **Verificar**: <=5 controles y el nombre precargado.

- [ ] **P1-13 · Auth: validaciones y errores en ingles; login exige complejidad; el registro navega aunque falle** · Sev MEDIA · Esf S
  `[REG-08]`
  - **Donde**: `src/features/auth/validations/index.ts:3-34`, `SigninForm.tsx:25,38,56,59`, `SignupForm.tsx:58-67`.
  - **Fix**: Zod en espanol. `signinSchema` con password `min(1)`. Mapear `error.code` (invalid_credentials, email_not_confirmed, user_already_exists…). En el registro: `if (error) return`; si `!data.session`, mostrar "Te enviamos un correo para confirmar tu cuenta"; `identities.length===0` → "ya registrado". `name.trim().min(2)`.
  - **Verificar**: login con `klaushop2026` (sin simbolo) se intenta. Credenciales malas → "Correo o contrasena incorrectos".

- [ ] **P1-14 · El filtro de precio por defecto oculta productos de >= 10000 CUP** · Sev MEDIA · Esf S
  `[ADMIN-CAT-06, CODE-12]`
  - **Donde**: `SearchProductsInifiteScroll.tsx:7-18,125-129`, `SearchResultPage.tsx:26` (`gt/lt` estricto), `PriceRange.tsx:17-29` y `FilterSelections.tsx` (tope 10000).
  - **Fix**: enviar lower/upper solo si hay `price_range`; usar `gte/lte`; el maximo del slider sale del precio maximo real. `npm run codegen`.
  - **Verificar**: producto QA a 12000 → aparece en /shop sin filtro.

- [ ] **P1-15 · La busqueda es sensible a tildes ("lapices" → 0)** · Sev MEDIA · Esf M
  `[GUEST-13]`
  - **Donde**: `SearchResultPage.tsx:25`, `SearchProductsInifiteScroll.tsx:126`, `SearchInput.tsx:37`.
  - **Fix**: extension `unaccent` + columna normalizada mantenida por trigger (o funcion `search_products(term)` expuesta en pg_graphql). Normalizar el termino en el cliente (NFD). Usar `encodeURIComponent`. El estado vacio va en espanol con `slice(1,-1)` (hoy corta "lapice").
  - **Verificar**: "lapices" y "lápices" devuelven los mismos 2 productos.

- [ ] **P1-16 · Las reservas nunca caducan** · Sev MEDIA · Esf S (filtro admin) / M (TTL) · **Decision del dueno**
  `[INTEGRITY-04, CODE-15]`
  - **Donde**: `src/features/orders/utils/inventory.ts:18-47,95-118`, sin `expires_at` ni pg_cron. Hay una reserva real activa desde 2026-01-07 (pedido `j8oybiaeusddmxq0yl9ab424`, pending_payment).
  - **Fix minimo**: filtro o badge en el admin "Pendientes > 48 h" con un Cancelar rapido. Opcional: ignorar en `getAvailableStock` las reservas de `pending_confirmation` con mas de N h, o un cron que cancele (acordar antes el WhatsApp que recibe el cliente). **No** caducar `pending_payment`.
  - **Verificar**: listado de pendientes antiguos visible en /admin/orders.

- [ ] **P1-17 · La ficha muestra stock fisico y no el disponible (cifras contradictorias); check-stock en cada toque de variante** · Sev MEDIA · Esf S
  `[GUEST-15, CODE-22]`
  - **Donde**: `src/features/products/components/ProductStockDisplay.tsx:20-39`, `AddProductToCartForm.tsx:90-96`, `useAvailableStock.tsx:49` (deps de variante), `ProductCard.tsx:229-238`.
  - **Fix**: el disponible se calcula en el servidor o con 1 sola llamada por producto (deps `[productId]`), subido a `ProductStockAndFormWrapper` y compartido por cabecera y formulario. Sin caer al fisico mientras carga.
  - **Verificar**: `qa-integridad-stock-1` (stock 1, 1 reservado) muestra "Sin stock" en ambos sitios. 4 toques de variante = 0 POST extra.

### Fase 2 — Refresco y datos obsoletos

- [x] **P2-01 · (HECHO 2026-10-04: `/shop/[slug]` con revalidate=60 + `revalidateStorefront()` en acciones de producto/coleccion, mark-paid y cancel. Verificado en dev: BD 100→150 visible a los 60 s; edicion admin → al instante) Ficha de producto, menu y footer cacheados 1 ano (Data Cache de Next); ninguna mutacion revalida** · Sev ALTA · Esf M
  `[GUEST-06, PERF-01, CODE-03, ADMIN-CAT-05]`
  - **Donde**: `src/lib/urql-service.ts:11-27` y `src/lib/urql.ts:14-24` (fetchOptions solo con cabeceras). `src/app/(store)/shop/[slug]/page.tsx` (sin `dynamic`/`revalidate`; `notFound()` por stock usa el valor cacheado). Layout (store): CategoriesSubNav, MainFooter, SideMenuServer. Hay 0 `revalidatePath/Tag` en `src/`.
  - **Evidencia**: dev siguio en 100 CUP con la BD en 150/120/130. Prod siguio en 120 con la BD en 130. Un producto que paso por stock 0 da **404 en prod incluso tras reponerlo**. El title y el og muestran el precio viejo (links compartidos por WhatsApp).
  - **Fix**: en `makeServiceClient`/`makeClient`, `fetchOptions: { headers, next: { revalidate: 60, tags: ['catalog'] } }` (o `cache:'no-store'` para datos de usuario y pedidos). `revalidateTag('catalog')` en create/update/delete de producto y coleccion, en mark-paid, en cancel y en las ediciones de stock. Minimo inmediato: `export const dynamic = 'force-dynamic'` en `shop/[slug]/page.tsx`. Tras el deploy, **redeploy o purga de la Data Cache de Vercel**.
  - **Verificar**: `UPDATE products set price=… where id='<QA>'` (o desde el admin) → curl de la ficha muestra el nuevo precio en <=60 s (o al instante si se edito desde el admin). Stock 0 → 404, reponer → 200.

- [x] **P2-02 · (HECHO 2026-10-04: `/api/shipping-zones` force-dynamic) `/api/shipping-zones` es estatico desde el build** · Sev ALTA · Esf S
  `[GUEST-07, PERF-02, CODE-04]`
  - **Donde**: `src/app/api/shipping-zones/route.ts:6` (GET sin request: ○ Static). El CRUD admin no revalida.
  - **Fix**: `export const revalidate = 60` + `revalidatePath('/api/shipping-zones')` en POST/PATCH/DELETE admin + `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`. Alternativa: `dynamic='force-dynamic'` (payload de ~0.5 KB).
  - **Verificar**: `next build` muestra `ƒ` o ISR. Crear una zona QA activa → aparece en <=60 s en prod (`curl -I` → Age < 60).

- [x] **P2-03 · (HECHO 2026-10-04: force-dynamic en admin/orders, admin/collections y [collectionId]) La lista admin de pedidos, al navegar en cliente, muestra un snapshot viejo (8 en vez de 62)** · Sev ALTA · Esf S
  `[ADMIN-ORD-18]`
  - **Donde**: `src/app/(admin)/admin/orders/page.tsx:33` (sin `dynamic`; `cookies()` solo se ejecuta en layouts que no se re-renderizan al navegar). Igual en `admin/collections/page.tsx` y `[collectionId]/page.tsx`.
  - **Fix**: `export const dynamic = 'force-dynamic'` (como `admin/products/page.tsx:17-18`). Sale tambien de P0-02 si se cambia a Drizzle o service. Purgar `.next/cache/fetch-cache` y la Data Cache de Vercel.
  - **Verificar**: dashboard → menu "Ordenes" → "Todas (N)" = `select count(*) from orders`.

- [x] **P2-04 · (HECHO 2026-10-04: estado local tras la respuesta + useTransition; botones deshabilitados durante el refresh; verificado: 250 ms tras el API ya muestra "Pendiente de Pago") Tras una accion admin, la UI muestra unos segundos el estado anterior con los botones habilitados** · Sev MEDIA · Esf S
  `[ADMIN-ORD-08]`
  - **Donde**: `src/features/orders/components/admin/OrderStatusChanger.tsx:141-157`.
  - **Fix**: estado local `{status,paymentStatus}` desde la respuesta del API; `startTransition(()=>router.refresh())`; `disabled={isChanging||isPending}`.
  - **Verificar**: tras "Confirmar orden", la tarjeta muestra "Pendiente de Pago" al instante y no ofrece "Confirmar orden".

- [ ] **P2-05 · (NO REPRODUCIDO 2026-10-04: 0 consultas GraphQL tras 3 cambios de pestaña en /wish-list y /shop; posible solo al refrescar el token cada hora. Sin cambios) El cliente urql se recrea en cada cambio de sesion (y al volver el foco): consultas duplicadas, cache vacia, skeletons** · Sev MEDIA · Esf S
  `[PERF-10, CODE-23]`
  - **Donde**: `src/providers/UrqlProvider.tsx:19-55` (`useMemo([session])`, `suspense:true`), keys de graphcache (falta `id` en `product_mediasCollection`; carts por `product_id`). `AuthProvider.tsx:43`.
  - **Fix**: crear el cliente una sola vez y leer el token desde una ref en fetchOptions. `setSession` solo si cambia el access_token. Pedir `id` en `product_mediasCollection` (ProductCard, ProductImageShowcase) o declarar `keys`. La key de carts debe ser `id`.
  - **Verificar**: logueado en /wish-list, simular visibilitychange → 0 consultas nuevas y sin skeleton.

- [x] **P2-06 · (HECHO 2026-10-04: `RefreshOnFocus` en /orders y /orders/[id], router.refresh al volver a la pestaña con throttle de 15 s; verificado con cliente QA) La vista del pedido del cliente no se refresca sola** · Sev MEDIA · Esf S
  `[REG-11]`
  - **Fix**: componente cliente que llama a `router.refresh()` en `visibilitychange`/`focus`, con throttle de 15 s, en `/orders` y `/orders/[id]` (sin websockets ni polling).
  - **Verificar**: el admin confirma el pedido y el cliente que vuelve a la pestana ve "Pendiente de Pago".

- [ ] **P2-07 · Favoritos: la lista no se actualiza al quitar, quedan en el dispositivo tras logout, toasts en ingles** · Sev BAJA · Esf S
  `[REG-13]`
  - **Donde**: `AddToWishListButton.tsx:61-67`, `WishlistProducts.tsx:50,69,74-86`, `AuthProvider.tsx:110-113`.
  - **Fix**: filtrar por el store; `setWishlist({})` en SIGNED_OUT; toggle solo si la mutacion fue bien; copy en espanol.

### Fase 3 — Rendimiento y consumo de datos (+ estrategia de cache local)

- [ ] **P3-01 · La tienda descarga ~300 KB gzip de codigo de admin (recharts, xlsx, quill, framer-motion, drizzle, tanstack)** · Sev ALTA · Esf M
  `[PERF-04, CODE-10, GUEST-18, ADMIN-CAT-10]`
  - **Donde**: `src/features/products/components/index.ts:21-28` (re-exporta ProductForm, ProductsColumns, ProductsDataTable, ExportProductsButton). Mismo patron en `features/orders/components/index.ts`, `features/cms` (Overview → recharts) y `features/medias` (MultiImagesField → framer-motion). `CollectionForm.tsx:21` y `UpdateMediaForm.tsx:34` importan valores de drizzle. `src/components/ui/rich-text-editor.tsx:4` (react-quill rompe el SSR: "document is not defined" / React #419 en el grid de /shop).
  - **Fix**: entradas separadas `@/features/x/admin` y actualizar los imports de `src/app/(admin)`. ProductCard importado directo en los componentes de tienda. Schemas Zod del cliente sin la tabla drizzle. `next/dynamic(() => import('react-quill'), { ssr:false })`. Verificar con @next/bundle-analyzer. Esto **cambia la convencion de barrels** de `docs/project-structure.md`: documentar la excepcion admin.
  - **Verificar**: `next build` → First Load JS de `/`, `/shop`, `/shop/[slug]` y `/cart` baja ~300 kB (objetivo <=320 kB). `app-build-manifest '/(store)/page'` sin recharts, SheetJS, quill ni drizzle. curl `/shop` sin `<template data-dgst>`.

- [ ] **P3-02 · Imagenes sobredimensionadas en movil y la imagen de hover se descarga en tactil** · Sev MEDIA · Esf S
  `[GUEST-19, PERF-07, CODE-11]`
  - **Donde**: `ProductCard.tsx:134-155` (width 400 sin `sizes` → w=828; hover con opacity-0 siempre montado). `ProductImageShowcase.tsx:61-67` (w=2048, lazy, sin priority). Banner de la home `page.tsx:419` (`fill` sin sizes → 1200w/3840w). CartItemCard, CollectionsCard, BuyAgainCard, OrdersList.
  - **Fix**: `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"` en las tarjetas. La imagen de hover solo con `(hover: hover)` y no pedir `/api/products/additional-images` en tactil. Imagen principal con `priority` + `sizes="(max-width: 768px) 100vw, 672px"`. Opcional: `quality={60}` y AVIF.
  - **Verificar**: Pixel 5 /shop → las tarjetas piden <=640w, 0 imagenes `opacity-0` cargadas, bytes de imagen ≈ -30-40% (hoy 681-807 KB).

- [ ] **P3-03 · Las imagenes optimizadas caducan a los 60 s** · Sev MEDIA · Esf S
  `[PERF-08]`
  - **Donde**: `next.config.mjs` (sin `images.minimumCacheTTL`); `src/app/api/medias/route.ts:52-57` (PutObject sin CacheControl; 120 de 126 objetos con `no-cache`).
  - **Fix**: `images.minimumCacheTTL = 2592000` (las claves son nanoid, inmutables). En las subidas nuevas, `CacheControl: 'public, max-age=31536000, immutable'`.
  - **Verificar** (con `next start`, no con dev): `/_next/image` → `max-age=2592000`.

- [ ] **P3-04 · Catalogo GraphQL: `description` en cada tarjeta + 2a consulta de autofill siempre** · Sev MEDIA · Esf S
  `[PERF-09]`
  - **Donde**: `ProductCard.tsx:33` (fragmento con `description` que no se usa). `SearchResultPage.tsx:13-45,106-147` (`nextCount` se calcula dentro del updater: la 2a consulta se dispara siempre).
  - **Fix**: quitar `description` del fragmento. Filtrar `{ stock: { gt: 0 } }` en el servidor (Search, LandingRouteQuery, recomendaciones) y borrar el autofill. `npm run codegen`.
  - **Verificar**: /shop → 1 POST Search de ~10 KB sin comprimir (hoy 2 × 30-35 KB).

- [ ] **P3-05 · Peticiones redundantes: carrito ×2-3 con join completo, zonas ×2 por apertura, avatar 404, check-stock triple** · Sev MEDIA · Esf M
  `[REG-15, CODE-16, PERF-14 (zonas)]` (+ `GUEST-16` cookie del carrito, baja)
  - **Donde**: `CartNav.tsx` montado en `MainNavbar.tsx:57` y `MobileNavbar.tsx:25`; `carts/api.ts:42-70` (`description` en el select); `UserCartSection.tsx:55-74` (`fetching=true` en cada +/-, sin `cart-updated` → badge viejo); `UserNav.tsx:49`/`ProfileClient.tsx:209` (`/avatars/01.png` no existe); `useCartStore.ts:49` (`storage:'cookies'` sin path → cookie duplicada en `/shop` y `/`, enviada en cada request).
  - **Fix**: un store unico del carrito logueado (Zustand) con actualizacion optimista; el contador con `select('quantity')`; un solo CartNav. Zonas de P1-04. Quitar el fallback de avatar. Carrito invitado con `storage:'localStorage'` (y expirar la cookie vieja).
  - **Verificar**: /cart logueado (prod) → 1 lectura de carts; +/- sin skeleton; 0 GET avatar 404.

- [ ] **P3-06 · Sin service worker: sin red, la app muestra la pagina de error del navegador** · Sev MEDIA · Esf M
  `[PERF-06]`
  - Ver **Estrategia de cache / offline**. Se adapta `tf-add-mobile` a Next 14 (solo la tienda, no el admin).
  - **Verificar**: cargar /shop, ir offline y recargar → pagina offline en espanol con enlace a /cart. /cart se ve con los items del localStorage.

- [ ] **P3-07 · "Cargar mas" sin conexion: el boton desaparece y no hay reintento** · Sev MEDIA · Esf S
  `[PERF-11]`
  - **Donde**: `SearchProductsInifiteScroll.tsx:62-80`, `SearchResultPage.tsx:97-100,208-246`, `UrqlProvider.tsx:24-37` (sin retryExchange, aunque `@urql/exchange-retry` esta instalado).
  - **Fix**: anadir el cursor solo cuando la pagina carga. Mostrar "Sin conexion. Reintentar" con `reexecuteQuery({requestPolicy:'network-only'})`. Reintentar en el evento `online`. `retryExchange` con `retryIf: e => !!e.networkError`.
  - **Verificar**: offline → pulsar "Cargar mas" → aparece el mensaje; volver online → carga.

- [ ] **P3-08 · Cliente Postgres sin limite ni singleton (EMAXCONN) y error crudo al usuario** · Sev MEDIA · Esf S
  `[ADMIN-ORD-11, CODE-09]` (+ `INTEGRITY-08` latencia del checkout, baja)
  - **Donde**: `src/lib/supabase/db.ts:10`; `message: error.message` en checkout, admin/orders/*, addresses/* y promote-user.
  - **Fix**: `globalThis.__pg ??= postgres(url,{prepare:false,max: prod?1:5, idle_timeout:20, connect_timeout:10})`. Los 500 llevan mensaje generico en espanol. Opcional (INTEGRITY-08): resolver la zona antes de la tx, disponible en 1 query (JOIN SUM ... FOR UPDATE OF products), inserts multi-fila, quitar console.log. **Medir en Vercel antes de optimizar** (dev ~12 s por RTT de 300 ms; en prod se estiman 150-300 ms). No apuntar el dev server al pooler de produccion, o al menos usar un `max` pequeno.
  - **Verificar**: `Get-NetTCPConnection -RemotePort 6543` del proceso next dev se mantiene bajo tras varios HMR.

### Fase 4 — Admin

- [ ] **P4-01 · Detalle de pedido (admin y cliente) con la variante equivocada si hay 2 del mismo producto** · Sev ALTA · Esf M
  `[ADMIN-ORD-05, REG-17]`
  - **Donde**: `src/app/(admin)/admin/orders/[orderId]/page.tsx:192-194` y `src/app/(store)/orders/[orderId]/page.tsx:158-160` (`reservations.find` por productId). `order_lines` no tiene variante. "Comprar de nuevo" (`orders/page.tsx:36`) lista 8 productos al azar.
  - **Fix**: columnas `color/size/material` en `order_lines` (migracion), rellenadas en checkout y admin create, y pintadas desde la linea. Para pedidos viejos, emparejar consumiendo cada reserva una sola vez. Renombrar "Comprar de nuevo" a "Te puede interesar" o filtrar por los productos comprados. Anadir la variante al WhatsApp.
  - **Verificar**: KS-H2PF (`u1dxxen78rnbunqm38vxh2pf`) muestra rojo/S y azul/M.

- [ ] **P4-02 · El formulario de colecciones repite la consulta GraphQL sin fin (no se puede crear ni editar)** · Sev ALTA · Esf S
  `[ADMIN-CAT-02]`
  - **Donde**: `CollectionForm.tsx:145-149` con urql `suspense:true` y sin `<Suspense>` en `admin/collections/new/page.tsx:12-13` ni en `[collectionId]/page.tsx:42`.
  - **Fix**: cargar las colecciones padre en el servidor y pasarlas por prop (0 consultas cliente), o como minimo envolverlo en `<Suspense>` como ProductForm. Validacion visible con FormField. Traducir "Add Collection", "Image Gallery" y "Label*".
  - **Verificar**: <=2 CollectionsQuery en 30 s; el dialogo de imagen abre; enviar vacio muestra errores en espanol.

- [ ] **P4-03 · Editar un producto sobrescribe el stock (lost update frente a mark-paid)** · Sev MEDIA · Esf S
  `[CODE-17]`
  - **Donde**: `ProductForm.tsx:87-97,137-174`, `src/_actions/products.ts:88-97`.
  - **Fix**: omitir `stock` si no cambio, o `where stock = originalStock` con aviso "El stock cambio mientras editabas", o aplicarlo como delta en tx.
  - **Verificar**: abrir la edicion (5), restar 2 por SQL, guardar sin tocar → la BD queda en 3.

- [ ] **P4-04 · Nueva orden admin: un 2o clic en "Crear orden" la duplica** · Sev MEDIA · Esf S
  `[ADMIN-ORD-06]`
  - **Donde**: `AdminOrderCreateForm.tsx:165-201,570`.
  - **Fix**: tras el exito, `router.push('/admin/orders/'+id)`. Opcional: `client_request_id` (reutilizar el de P0-06).

- [ ] **P4-05 · Nueva orden: muestra el stock fisico y no deja 2 variantes del mismo producto** · Sev MEDIA · Esf S
  `[ADMIN-ORD-17]`
  - **Donde**: `admin/orders/new/page.tsx:16`, `AdminOrderCreateForm.tsx:147-153,240-242`.
  - **Fix**: "Disponible: N" (stock - reservas activas); siempre una linea nueva por variante.

- [ ] **P4-06 · Lista de pedidos sin cliente, telefono, total ni fecha; busca solo por numero** · Sev MEDIA · Esf S-M
  `[ADMIN-ORD-07]`
  - **Donde**: `OrdersColumns.tsx:23-37` (fragmento con `order_lines` sin uso), `OrdersDataTable.tsx:159-185,231,354`.
  - **Fix**: anadir `name, phone, amount, shipping_cost, created_at, zone` (y quitar order_lines). Columnas Cliente/Total/Fecha (en movil, una tarjeta). Busqueda por nombre y telefono. "Sin resultados". Paginacion en servidor mas adelante.

- [ ] **P4-07 · Detalle movil: las acciones quedan abajo y "Eliminar" antes que el cliente** · Sev MEDIA · Esf S
  `[ADMIN-ORD-14]`
  - **Donde**: `admin/orders/[orderId]/page.tsx:123-383`.
  - **Fix**: en movil, la tarjeta de estado y el cliente primero (`order-first md:order-none`); "Eliminar" al final o en un menu.

- [ ] **P4-08 · Demasiados pasos por pedido (9-11 clics), sin acciones rapidas** · Sev MEDIA · Esf M · **Decision del dueno** (pagada + entregada en 1 clic)
  `[ADMIN-ORD-15]`
  - **Donde**: `OrderStatusChanger.tsx:83-96`, `orderStatus.tsx:97-104`, `OrdersColumns.tsx:151-156`.
  - **Fix**: modal solo para pagar y cancelar; boton "Siguiente paso" arriba; "Confirmar" y "Marcar pagada" en el menu de la fila; "Editar Ordenes" → "Ver orden".

- [ ] **P4-09 · El formulario de producto no muestra la mayoria de los errores y acepta producto invalido** · Sev MEDIA · Esf S
  `[ADMIN-CAT-04]`
  - **Donde**: `ProductForm.tsx:57,203-238,428-498`, `src/_actions/products.ts:42`.
  - **Fix**: un `productFormSchema` compartido con mensajes en espanol (name/slug obligatorios, slug con regex, precio > 0, stock entero >= 0, descuento 0-100) y FormField en todos los campos. El slug duplicado se muestra como "Ese slug ya existe".

- [ ] **P4-10 · Bajos admin** · Sev BAJA · Esf S c/u
  - `[ADMIN-ORD-13]` El envio se puede editar en pedidos pagados, entregados o cancelados: 409 en el route y ocultar ShippingCostEditor fuera de pending_*.
  - `[ADMIN-ORD-16]` "Abrir WhatsApp" tras crear abre el numero de la tienda: generar `wa.me/<cliente>` con texto para el cliente (sin link de orden) o quitar el boton.
  - `[ADMIN-ORD-19]` Export CSV: fecha dd/MM/yyyy America/Havana, estados traducidos, columna KS-XXXX, cabeceras en espanol y prefijar `'` a celdas que empiezan por `=+-@`.
  - `[ADMIN-ORD-21]` Errores de negocio → 409/404 tipados (no 500); `AdminShell.tsx:26,29` con `w-full max-w-*`; la tarjeta de productos de /admin/orders/new se corta a 393 px.
  - `[ADMIN-CAT-07]` No hay "Publicado": arreglar el copy de `products.ts:150`; `is_active` es decision del dueno.
  - `[ADMIN-CAT-08]` Las colecciones sin estado oculto: hoy se ven QA y la vacia "Pareos" → ocultar colecciones sin productos (y P0-13).
  - `[INTEGRITY-13]` change-status valida el body antes que el auth: mover el auth arriba y usar Zod `safeParse`.
  - `[INTEGRITY-12]` GET `/api/medias/[id]` publico con 201 y bucket ajeno `hugo-coding`: borrar el GET; avatar con content-type erroneo → 400.
  - `[INTEGRITY-14]` Caracteres bidi (U+202E) en notas y direccion: helper Zod que quite U+202A-202E/2066-2069 y C0 salvo `\n\t`.
  - `[CODE-21]` console.log de sesion y datos: quitarlos (SigninForm:56, checkout 52/60-63/185, promote-user:52) y/o `compiler.removeConsole` excepto error/warn.

### Fase 5 — Pulido y copy

- [ ] **P5-01 · Textos en ingles y `<html lang="en">`** · Sev BAJA · Esf S
  `[GUEST-12, REG-14, ADMIN-ORD-20, ADMIN-CAT-09, PERF-12, CODE-19]`
  - **Prioridad**: "Add to Cart"/"Quantity" (`AddProductToCartForm.tsx:185,205`), "Low Stock (n left)"/"In Stock (n)"/"Out of Stock" (`ProductCard.tsx:229-237`), los toasts del carrito en `GuestCartSection.tsx:93,116,131` **y** `UserCartSection.tsx:127,152,161`, `<div>Error</div>` sin reintento (`GuestCartSection.tsx:66`), `src/app/layout.tsx:21` → `lang="es"`, `src/app/not-found.tsx` en espanol con enlace a /shop, footer "CreativeCode. All rights reserved." (`MainFooter.tsx:185`, `SideMenu.tsx:124`), "There is no Products…"/"Oh no…" (`SearchResultPage.tsx:210-220`), "No results." (7 tablas admin), "Acc", "Editar Ordenes", BadgeSelectField, "Image not found", "Project Tag", `/setting/newsletter` (borrar), "(se guardan en Supabase Auth)", placeholder de email "Type Product slug." (`AdminUserForm.tsx:96`, `UpdateUserForm.tsx:99`). "Pendiente" frente a "Sin pagar" (unificar). Badge "Reembolso pendiente" en canceladas pagadas (decision del dueno).
- [ ] **P5-02 · Emojis del mensaje WhatsApp llegan como "�" tras la redireccion de wa.me** · Sev BAJA · Esf S
  `[GUEST-17, CODE-20]` · `src/features/orders/utils/whatsapp.ts:111` y `ShareProductButton.tsx:69` → usar `https://api.whatsapp.com/send?phone=…&text=…` (ademas ahorra 1 redirect).
- [ ] **P5-03 · Friccion menor** · Sev BAJA · `[GUEST-22]` toast "Producto agregado" con la accion "Ver carrito"; zonas de Santa Clara primero; hex de color → nombre en espanol en el WhatsApp (solo la muestra en la tarjeta); `formatPrice` unificado a "200.00 CUP".
- [ ] **P5-04 · El banner "Explorar Ropa" lleva a `/collections/cupboard` (404)** · Sev BAJA · `[PERF-13]` · `src/app/(store)/page.tsx:210` → `/collections/womens-clothing` o `/shop` (decision del dueno).

---

## Estrategia de cache / offline

Medido en el build de produccion con Pixel 5, 3G 400 ms / 50 KB/s y CPU x4:

| Pagina | 1a visita (frio) | Visita repetida | Nota |
|--------|------------------|-----------------|------|
| Home | 1332 KB / 71 req (JS 658, img 588) · LCP 7.2 s | 32 KB | `_next/static` immutable funciona bien |
| /shop | 1504 KB / 82 req (JS 662, img 738) · LCP 21 s | 49 KB | 2 Search GraphQL (2a sobra) |
| /shop/[slug] | 969 KB (JS 658, img 225) · LCP 32 s (lazy + w=2048) | 31 KB | hidrata a ~23 s |
| /cart | 921 KB (JS 690) | 27 KB | |
| Home pasados 65 s | — | 16/18 imagenes revalidan (304) | TTL de 60 s del optimizador |

**Cachear en local (cliente):**
- **Estaticos** `/_next/static/*`, fuente y CSS: ya son `immutable`. En el SW, CacheFirst 30 dias.
- **Imagenes** `/_next/image`: `minimumCacheTTL` 30 dias (P3-03) + SW CacheFirst con un maximo de ~200 entradas.
- **Zonas de envio**: localStorage con TTL de ~1 h y stale-while-revalidate (431 B; el servidor recalcula siempre el costo, asi que es seguro).
- **Carrito del invitado** (ya en localStorage) y **datos del invitado** (GUEST_ADDRESS_KEY, ya existe).
- **Ultimo checkoutId pendiente** (sessionStorage) para la idempotencia (P0-06).
- **whatsappUrl** del ultimo pedido (sessionStorage) para el boton de la confirmacion (P1-02).
- **Catalogo ya visto** (documentos/RSC de `/`, `/shop`, `/collections/*`, `/shop/*`): SW StaleWhileRevalidate con un maximo de ~50 entradas, **solo para lectura offline**. Hacerlo en un segundo paso, cuando P2-01 este arreglado, y siempre con la comprobacion de stock en vivo antes de comprar.
- **Pagina offline** en espanol con enlace a /cart.

**Cache del servidor/CDN (nada en el cliente):**
- Catalogo GraphQL en RSC: `revalidate: 60` + tag `catalog` + `revalidateTag` en las mutaciones (P2-01). Ahorra round-trips a Supabase sin servir precios viejos.
- `/api/shipping-zones`: `s-maxage=60, stale-while-revalidate=600` + `revalidatePath` (P2-02).

**NUNCA cachear (NetworkOnly / `no-store`):**
- `/api/checkout/*`, `/api/inventory/check-stock`, `/api/admin/*`, `/api/addresses*`, `/api/orders*`.
- `/orders`, `/orders/*`, `/admin/*`, `/setting/*`, `/sign-in`.
- GraphQL de pedidos y usuario, `/auth/v1/*`, `/rest/v1/carts`.
- El stock disponible (siempre en vivo; el servidor del checkout es la ultima defensa).

**Reducir bytes en la 1a visita** (objetivo de JS <=320 KB y fuera del camino LCP): P3-01 (-300 KB JS), P3-02 (-30-40% imagenes), P3-04 (-70% GraphQL de tarjetas), P1-08 (sin 403 ni prefetch de /sign-in: -12 KB y 1-2 RTT por carga).

---

## Flujo de venta propuesto

**Actual** (invitado, producto con 3 variantes): unos **19 toques, 6 pantallas** (home → PDP: color, talla, material×2 → Agregar → icono del carrito → carrito → "Continuar con WhatsApp" → nombre, telefono, zona×2 → enviar → confirmacion → app de WhatsApp → Enviar). Problemas en el camino:
- No hay CTA tras agregar.
- La zona arranca en "Otro".
- El total no se ve.
- El popup se bloquea y no hay boton.
- El carrito no se vacia.
- Logueado con direccion guardada: 2 clics desde el carrito (bien). Logueado sin direccion: 7 controles.

**Propuesto** (sin cambiar el modelo de negocio):
1. PDP: variantes preseleccionadas si solo hay una opcion → "Anadir al carrito" (deshabilitado hasta hidratar) → toast con **"Ver carrito"**.
2. Carrito: lineas + **Subtotal** → "Continuar con WhatsApp".
3. Dialogo (invitado): nombre, telefono (validado y normalizado) y zona (placeholder o la ultima usada; Santa Clara primero) + direccion/notas opcionales → **resumen Subtotal / Envio / Total** → "Confirmar pedido". Envio idempotente.
4. Confirmacion: numero KS-XXXX, total y **boton grande "Enviar pedido por WhatsApp"** (enlace con gesto del usuario), carrito vaciado y `router.replace`.

Objetivo: **~14 toques, 4 pantallas + WhatsApp**, invitado que vuelve con 0 campos que teclear, 0 duplicados en reintentos.

---

## Lo que funciona (cobertura)

- **Integridad de stock** en el checkout: `FOR UPDATE` + `assertCartStock` dentro de la tx, por producto, sumando variantes y lineas. 10 POST concurrentes por la ultima unidad → 1 pedido y 9 x 409; 8 POST con stock 2 → 2 pedidos. Los riesgos 3/4 de `riesgos-detectados-2026-09-24` ya estan corregidos en el codigo que corre (tambien en prod).
- **Precio, descuento y envio calculados en el servidor**: se ignoran los precios del cliente; `order_lines` guarda price/list_price/discount; `amount` = subtotal + envio; zona resuelta por id con respaldo por nombre; zona inactiva o "Otro" → envio NULL "por definir".
- **Ciclo de vida admin**: transiciones validas; mark-paid consume reservas y descuenta stock; cancel libera y repone; enviado no se cancela; entregado y cancelado son finales. Los endpoints admin responden 401/403 a anonimos y a no-admin. El dashboard cuadra con SQL. El export CSV esta protegido.
- **Checkout invitado** de punta a punta en movil. El doble toque no duplica. Sin red no se crea pedido. El invitado que vuelve tiene sus datos precargados. Validaciones del formulario en espanol. 409 si no hay stock.
- **Logueado**: direccion predeterminada preseleccionada (2 clics), CRUD de direcciones con zona, estados del pedido en espanol, un cliente no ve pedidos de otro registrado (404).
- **XSS** escapado en el admin; limites de longitud; cantidades invalidas → 400.
- **RLS activado** en las 14 tablas; `private_config` sin grants; shipping_zones e inventory_reservations solo SELECT para anon.
- **Subida de imagenes**: compresion en el cliente (7.3 MB → 0.95 MB WebP), estados por archivo, nunca supera 4.5 MB.
- **Estaticos immutable**: la visita repetida cuesta 26-49 KB. Una sola fuente (34 KB). WebP en todas las imagenes.

## No probado (y por que)

- **Entrega real de WhatsApp** en +5353077035: OpenWA devuelve 500 a todo (P0-05). La plantilla se reviso en SQL.
- **Bloqueo real del popup** en iOS Safari o en Android fisico: Playwright/Chromium headless no lo bloquea, y WebKit no esta instalado.
- **wa.me con la app de WhatsApp instalada** (App Links podria conservar los emojis).
- **Tiempos absolutos en Vercel**: los tiempos de dev (5-60 s) estan inflados por compilacion, testers en paralelo y RTT de ~300 ms a Supabase. Se reportan bytes y round-trips.
- **Escrituras en produccion (Vercel)**: solo lectura, mas un cambio de precio de un producto QA.
- **Registro real por UI**: `mailer_autoconfirm=false` enviaria correo; los usuarios se crearon por la admin API. Recuperacion de contrasena con un enlace real, cambio de email, OAuth (desactivado).
- **Acciones destructivas sin sesion** (deleteOrderAction, deleteUserAction, createUser, listUsers): se demostro con updateProductAction; el resto se confirmo por codigo.
- **Escalada `is_admin`** de punta a punta via PostgREST: se probo solo en una transaccion con ROLLBACK.
- **Pantallas no cubiertas**: modal `@mediaModal`, `/admin/shipping-zones` (CRUD), `/admin/users`, `promote-user` y el admin en telefono para catalogo. La instancia :3002 cayo a mitad de la prueba.
- **Coste real de la cabecera Cookie en HTTP/2** (HPACK) y AVIF (estimado, no medido).
- **Refresco de token real tras 1 h**: se simulo reescribiendo `expires_at`.

## Hallazgos descartados

Ninguno. Los 123 hallazgos se confirmaron (total o parcialmente) por al menos un revisor. En varios se **bajo la severidad** respecto al tester; quedan reflejados arriba con la severidad calibrada:
- GUEST-01/04/09/12, REG-12, INTEGRITY-04/05/08/09: de critico o alto a alto o medio.
- ADMIN-ORD-07/08/09/13/16, ADMIN-CAT-07, PERF-03, CODE-07/09/18: a medio o bajo.

En otros se **subio**:
- REG-02, ADMIN-ORD-12/18, CODE-13/17/22/23/24, GUEST-18, ADMIN-CAT-10.

## Aprendizajes (self-annealing)

- **Next 14**: todo `fetch` de un RSC sin `cookies()` en el mismo render se guarda en la Data Cache durante 1 ano, **incluidos los POST de urql a pg_graphql**. Revisar `dynamic`/`revalidate` en cada pagina nueva y etiquetar las consultas.
- **Next 14**: un GET de route handler sin `request` se prerenderiza estatico (○).
- Exportar una funcion sincrona desde un archivo `'use server'` la convierte en Promise (`isAdmin` siempre truthy).
- Las politicas creadas a mano en Supabase no estan en `drizzle/rls_policies.sql`: auditar `pg_policies` en vivo, no el repo.
- El estado `ready` de OpenWA no garantiza que se envie: monitorear `net._http_response`.
- En tactil, probar con `tap()` y no solo con `click()`: el "clic fantasma" de Radix Select 2.0.0 solo ocurre con el dedo.
- Playwright WebKit no bloquea popups ni simula el zoom de iOS: esos casos se confirman en un iPhone real.

---

## Anexo A — Pedidos sin envio / envio negociado por WhatsApp (requisito del dueño)

Workflow complementario (2026-10-02/03): invitado (iPhone WebKit y Chromium movil), cliente registrado con direccion "Otro", orden manual del admin y ciclo completo via endpoints. Un esceptico verifico cada hallazgo.

**Estado:** crear pedidos sin zona con precio YA funciona: la zona "Otro / no aparece" + texto libre guarda `shipping_zone_id NULL`, `shipping_cost NULL` = "Por definir" y `amount` = subtotal. Lo que falla es lo de despues.

- [x] **SN-04 · "Total" = subtotal junto a "Envio: Por definir"** en todas las vistas y en WhatsApp · Sev ALTA · Esf S — mostrar "Total: 500.00 CUP + envio a acordar" (`getOrderTotals` y funciones SQL de WhatsApp).
- [x] **SN-01 · Confirmar o marcar pagada con el envio sin definir** → el cliente recibe "Total a pagar: 500.00 CUP" · Sev ALTA · Esf S — `change-status/route.ts:66-80` y `wa_notify_order_status` (0015:101). Bloquear o advertir: **decision del dueño**.
- [ ] **SN-03 · El cliente no recibe aviso cuando el admin fija el envio** · Sev MEDIA · Esf S/M — mensaje "envio X, total a pagar Y", con un trigger por cambio de `shipping_cost` o al confirmar.
- [ ] **SN-02 · El envio se puede editar con la orden ya pagada** (500 → 900 CUP; cambian amount e ingresos) · Sev MEDIA · Esf S — `update-shipping` solo en pending_confirmation y pending_payment.
- [x] **SN-05 · No hay una opcion explicita "Recoger en tienda" ni "Acordar envio por WhatsApp"**; "Otro" exige al menos 2 caracteres de zona · Sev MEDIA — **decision del dueño** (opciones abajo).
- [x] **SN-07 · El selector de zona arranca en "Otro / no aparece"**; un texto que no coincide con una zona queda "por definir" · Sev MEDIA · Esf S.
- [ ] **SN-08 · El admin no ve que pedidos tienen el envio por acordar** (ni en la lista ni en el aviso de nuevo pedido) · Sev MEDIA · Esf S — insignia "Envio por acordar".
- [ ] SN-09 (baja) el carrito no muestra linea de envio · SN-10 (baja) "Guardar" con el campo vacio pone "por definir"; el 0 no se muestra como "gratis/recogida" · SN-11 (baja) emoji corrupto en wa.me (= IOS-07).

**HECHO 2026-10-03 — el dueño eligio la opcion A y bloquear "Confirmar orden":** el selector ofrece "Recoger en tienda (sin envio)" (shipping_cost 0, zona "Recogida en tienda") y "Otra zona — acordar envio por WhatsApp" (texto opcional; vacio guarda "Por acordar"). Ya no hay opcion preseleccionada. Las vistas y el mensaje wa.me muestran "A acordar por WhatsApp" y "Total: X + envio". `change-status` (pending_payment) y `mark-paid` rechazan si `shipping_cost` es NULL, y los botones se deshabilitan. `drizzle/0019_whatsapp_shipping_to_agree.sql`: texto del aviso automatico (cliente: "+ envio"; admin: "Envio: POR ACORDAR"), **pendiente de aplicar**. Verificado E2E: Pixel 5 (otra zona vacia → 201) e iPhone 13 WebKit (recogida → 201, costo 0); admin con los botones bloqueados y la API rechazando, y al fijar 250 → total 450 y se habilita. Pendientes: SN-02, SN-03, SN-08 (insignia en la lista).

**Opciones de diseño (consideradas):**
- **A (sin migracion):** renombrar "Otro" a "Otra zona — acordar envio por WhatsApp" y añadir "Recoger en tienda (sin envio)", que guarda `shipping_cost = 0`. En la recogida no se pide direccion.
- **B:** crear desde /admin/shipping-zones la zona "Recogida en tienda" con costo 0, sin codigo nuevo. NULL queda solo para "a acordar".
- **C:** columna `orders.delivery_method` (`delivery | pickup | to_agree`), con migracion. Es lo mas claro para filtros y mensajes.
- **Regla de cobro:** (1) bloquear "Confirmar" y "Marcar pagada" hasta fijar el envio, o (2) permitirlo con advertencia y que el mensaje diga "Total a pagar: X + envio a acordar".

## Anexo B — iPhone (Safari / WebKit)

- [x] **IOS-01 · WhatsApp no se abre en iPhone tras pedir** — HECHO 2026-10-04: boton "Enviar pedido por WhatsApp" (enlace real) en la confirmacion, con el mensaje completo via sessionStorage (respaldo: mensaje corto con el numero de orden); copy corregido. **Pendiente: validar en un iPhone fisico.** · Sev **CRITICA** · Esf S — `window.open` se ejecuta despues de un `await` y un `setTimeout`, e iOS lo bloquea. La confirmacion dice "Hemos enviado tu pedido por WhatsApp" pero no tiene boton. Fix: navegar con `location.href` a `https://wa.me/...` y poner en la confirmacion un boton grande "Abrir WhatsApp" con el enlace como respaldo. **Verificar en un iPhone real** (Playwright WebKit no bloquea popups).
- [x] **IOS-02 · (HECHO 2026-10-04; falta el editor Quill a 13px) Inputs de 14px (12.25px en admin): iOS hace zoom en cada campo** · Sev ALTA · Esf S — usar `text-base` (16px) en los inputs en movil, tambien en el admin (`html{font-size:14px}` en `(admin)/layout.tsx:18`).
- [ ] **IOS-03 · El carrito del invitado no se vacia tras pedir** (= P0-07) · Sev ALTA.
- [ ] IOS-04 (baja) en iPhone SE el boton de enviar de los dialogos queda fuera de pantalla · IOS-05 (baja) el ITP de Safari puede borrar el carrito y la sesion tras 7 dias sin visita · IOS-06 (baja) faltan `type=email`, `autocomplete` y `autocapitalize` · IOS-07 (baja) los emojis de 4 bytes llegan como "�" en wa.me · IOS-08 (baja) tap targets de menos de 44px · IOS-09 (baja) `html lang="en"` y copy en ingles en el flujo de compra.

## Anexo C — Creacion de productos y controles en movil / iPhone (reporte del dueño: "no funcionan los botones ni los radiobuttons")

Probado con el dedo (`tap()`) en iPhone 13 y SE (WebKit) y en Pixel 5, control por control, comprobando el payload y la fila en BD.
**Conclusion:** en el formulario de producto los checkboxes, Selects, tags, colores y numeros SI guardan bien el valor. Lo que el usuario percibe como "no funciona" viene de estas causas:

- [x] **MPC-03 / CSA-1 · (HECHO 2026-10-04: preventDefault en touchend de SelectItem; 6/6 → 0/12 clics fantasma, seleccion intacta) "Clic fantasma" de Radix Select 2.0.0 con el dedo** · Sev ALTA · Esf S — al elegir una opcion, el clic cae en lo que hay debajo: **marca o desmarca los checkboxes "Destacado" / "Mostrar en Slider"**, abre el teclado o toca "Add to Cart". Es la causa mas probable de "los radios/checkbox no funcionan". `package.json:47`, `src/components/ui/select.tsx:114-133`. Fix: actualizar `@radix-ui/react-select` a ≥2.1 o usar `<select>` nativo en movil.
- [x] **MPC-01 / CSA-2 · (HECHO 2026-10-04: galeria max-h 90dvh con scroll, grid-cols-1 + rejilla auto-fill 120px; X de cerrar con area mayor; verificado iPhone SE/13) Dialogo de galeria de imagenes mas alto que la pantalla y sin scroll** · Sev ALTA · Esf S — la X de cerrar, el titulo y "+ Subir imagenes" quedan por encima del borde (en iPhone SE el "+" no se ve). Solo se sale eligiendo una imagen, y no se pueden subir fotos nuevas desde el producto. `src/features/medias/components/ImageDialog.tsx:66` (`min-h-full`) y `src/components/ui/dialog.tsx:41`. Fix: `max-h-[90dvh] overflow-y-auto` y una cabecera fija (sticky) con la X y el "+".
- [x] **MPC-04 / CSA-3 · (HECHO 2026-10-04) `<Input>` descarta la prop `type`** · Sev ALTA · Esf S — precio, stock y descuento salen con teclado de texto, y **las contraseñas de /setting/account se ven en claro**. `src/components/ui/input.tsx:45-46`. Fix: pasar `type` al elemento.
- [x] **MPC-02 · Formulario de coleccion congelado** — HECHO 2026-10-04: causa real = sin <Suspense> alrededor de CollectionForm (suspende con urql y se remontaba en bucle: 313 peticiones/20 s). Con <Suspense> en new y [collectionId]: 0 peticiones y el checkbox responde (escritorio e iPhone). Nota: `UrqlProvider` recrea el cliente (y pierde cache) en cada cambio de `session`; revisar junto a P1-08.: el checkbox "Mostrar en el Home", el Select de coleccion padre y la imagen no responden porque el query GraphQL se repite unas 2 veces por segundo · Sev ALTA · Esf S — `CollectionForm.tsx:145` (suspense `useQuery` de `@urql/next` con variables recreadas en cada render). Pasa tambien en escritorio. Confirmar en un build de produccion.
- [x] **MPC-08 · (HECHO junto a P0-11) Middleware en la carpeta equivocada** (`src/app/middleware.ts`, no se ejecuta): pasada una hora sin refrescar la sesion, las paginas admin fallan con "Cookies can only be modified…" · Sev ALTA · Esf S — moverlo a `src/middleware.ts` (= riesgo 5 de la memoria).
- [x] **MPC-05 / CSA-4 · (HECHO 2026-10-04: Input/Textarea 16px en movil) Zoom de iOS en cada campo del admin** (= IOS-02) · Sev MEDIA.
- [x] **MPC-06 / CSA-7 · (HECHO 2026-10-04: checkbox 20px cuadrado y radio 20px, ambos con area tactil ~44px via ::before; verificado en iPhone SE) Checkboxes de 14px, radios de 16px y X de chips de 10px**; tocar la tarjeta o la descripcion no marca, y el checkbox redondo parece un radio · Sev MEDIA · Esf S — areas tactiles de al menos 44px; la tarjeta entera dentro de un `<label htmlFor>`.
- [x] **MPC-07 / CSA-6 · (HECHO 2026-10-04: se añade al salir del campo, boton + visible, X de chips mas grande; paleta cabe en iPhone SE) Tags, tallas, materiales y colores solo se añaden con Enter**: el boton "+" esta vacio (0x0px) y el valor escrito se pierde al salir del campo · Sev MEDIA · Esf S — `tagsInput.tsx:41-51,78-80`: boton visible y añadir el valor en blur.
- [ ] CSA-5 / MPC-09 (media) el popover "Paleta" (w-96) se sale del iPhone SE y 23 colores no se pueden tocar · MPC-11 (media) en la tabla de zonas de envio a 320px, "Guardar" queda fuera de pantalla · MPC-10 (media) el formulario de producto no muestra skeleton mientras carga · CSA-8 (baja) la galeria encoge imagenes de 120px en columnas de 73–97px y se solapan · CSA-9 / MPC-12 (baja) "Recordarme" no hace nada · CSA-10 (baja) el rating no se puede borrar y los errores de Zod salen en ingles ("Required").

**Prioridad sugerida para el admin movil:** MPC-03 (Select) → MPC-01 (galeria) → MPC-04 (type) → MPC-02 (coleccion) → MPC-08 (middleware) → MPC-05/06/07.
