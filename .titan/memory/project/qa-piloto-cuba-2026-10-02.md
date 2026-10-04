# QA pre-piloto Cuba (2026-10-02) — estado de la ejecucion

QA general antes del piloto (7 personas QA, cada hallazgo verificado por 2 revisores) contra la BD de PRODUCCION.
71 items en 6 fases. Detalle completo, evidencia y "Estado de ejecucion": `.titan/plans/qa-piloto-cuba-2026-10-02.md`.
Evidencia: `.titan/qa/` (2026-10-02-piloto-cuba.md, capturas 2026-10-04-*.png). Ledger de datos QA: `.titan/qa/2026-10-02-datos-qa-ledger.jsonl`.

## Estado actual (2026-10-04, todo en `main` y desplegado en Vercel)

| Fase | Estado |
|---|---|
| 0 Bloqueantes (seguridad, stock, venta rota) | Hecha. P0-09 resuelto eliminando Stripe. Pendientes: P0-05 (aparcado), P0-10 en reset-password y AccountClient |
| 1 Friccion de venta | Hecha (P1-01..P1-17). P1-16 = solo aviso en admin |
| 2 Refresco / datos obsoletos | Hecha. Pendientes: P2-05 (no reproducido), P2-07 |
| 3 Rendimiento / datos / offline | Hecha. Parcial: P3-05 (ver abajo) |
| 4 Admin | Hecha (P4-08 y colecciones vacias hechos tras la decision del dueño) |
| 5 Pulido y copy | Hecha, incluido "Reembolso pendiente" + "Marcar como reembolsado" |
| Anexos (envios SN, iPhone IOS, admin movil MPC/CSA) | Hechos los altos. Pendientes: SN-02/03/08/09-11, IOS-04..09, MPC-09..11, CSA-5/8/9/10 |

**Migraciones aplicadas en prod:** 0018 (RLS), 0019 (WhatsApp envio a acordar), 0020 (perfiles al registrarse),
0021 (`orders.client_request_id`), 0022 (enlace admin → `/order/{id}`), 0023 (unaccent + `products.search_name`),
0024 (variante en `order_lines`; el aviso de nuevo pedido la muestra), 0025 (`wa_color_name`: colores en español).
Todas son manuales (fuera del journal de drizzle-kit); se aplican con node+postgres (ver `reference/acceso-bd-sin-mcp.md`).

## Decisiones del dueño
- OpenWA responde 500 pero **los mensajes SI llegan**: no es bloqueante (P0-05 aparcado).
- Envios: "Recoger en tienda" (costo 0) y "Otra zona — acordar por WhatsApp" (costo NULL). Confirmar o marcar pagada **exige** costo de envio.
- Reservas de pedidos viejos: **solo aviso en el admin** ("Hace N dias" en pendientes > 48 h), sin caducidad automatica.
- Direcciones con telefono raro corregidas a `+53 53077035` (autorizado).
- Acciones rapidas en la lista de pedidos: SI. "Pagada y entregada" en un paso (un solo WhatsApp al cliente).
- Colecciones sin productos con stock: **ocultas** en los menus de la tienda (la URL directa sigue funcionando).
- Banner "Explorar Ropa" → coleccion "Vestimenta para mujer" (`/collections/womens-clothing`).
- Pedidos cancelados que estaban pagados: etiqueta **"Reembolso pendiente"** (lista, detalle admin y detalle del cliente) y
  accion **"Marcar como reembolsado"** (`POST /api/admin/orders/[id]/mark-refunded` → `payment_status = 'refunded'`,
  "Reembolsado"). Solo cambia `payment_status`: no dispara WhatsApp. Helper `needsRefund()` en `features/orders/utils/paymentStatus.ts`.
- **Stripe eliminado del todo** (2026-10-04): rutas `create-checkout-session` y `webhook`, `CheckoutButton`, `src/lib/stripe`,
  paquetes `stripe`/`@stripe/stripe-js` y env vars. El checkout es solo WhatsApp. La columna `orders.stripe_payment_intent_id`
  sigue en la BD y en `schema.ts` (sin uso; borrarla requiere migracion). Las env vars STRIPE_* de Vercel ya sobran.
- Codigo muerto `NewsletterForm` borrado.
- Error intermitente de GraphQL en frio (`data-dgst` / "Visible collections check failed"): **se deja pendiente** (decision del dueño).
- Flujo de trabajo: commit y push **directo a `main`**; aplicar migraciones cuando el codigo que las necesita ya esta listo.

## Reglas que salieron de la QA (respetarlas en codigo nuevo)
- Toda mutacion que cambie precio, stock o colecciones llama `revalidateStorefront()` (`src/lib/revalidateStorefront.ts`).
- Codigo de admin solo via `@/features/{products,orders,collections,users}/admin`; nunca reexportarlo en `index.ts`
  (los barrels no hacen tree-shaking: metia ~350 kB de admin en la tienda). Documentado en `docs/project-structure.md`.
- `db.ts` es un pool singleton con `max: 1` en produccion: **nunca** usar `db` dentro de un `db.transaction` (usar `tx`), se bloquearia.
- Telefonos: fuente unica `src/lib/phone.ts` (`phoneSchema` normaliza a `+53 5XXXXXXX`; Cuba solo moviles 5/6).
- Errores al cliente: nunca `error.message` crudo de Postgres; mensajes en espanol (`features/orders/utils/checkoutErrors.ts`).
- Service worker `public/sw.js` (solo tienda, solo produccion): no cachear APIs, admin, pedidos ni cuenta; subir `VERSION` si cambia algo de `/public`.
- Login/registro: volver con `?redirect=` (helper `src/lib/safeRedirect.ts`, solo rutas internas).
- Busqueda: filtra por `products.search_name` (sin tildes); normalizar el termino con `features/search/utils/normalizeSearchTerm.ts`.
- Catalogo: filtrar `stock > 0` en la consulta GraphQL, no en el cliente.
- Lecturas por pg_graphql (`getServiceClient`), no Drizzle, sobre todo en layouts y paginas estaticas: una consulta Drizzle en el
  layout (pool `max: 1`) hizo que el build agotara el tiempo en `/about-us`.
- La variante de cada linea vive en `order_lines` (color/size/material): no deducirla de las reservas.
- Server actions: los errores de negocio se **devuelven** (`{ error }`), no se lanzan: Next oculta el mensaje en produccion.
- Texto libre del cliente (nombre, direccion, notas): pasa por `stripUnsafeChars` (`src/lib/safeText.ts`) en los schemas Zod.
- Envio: solo editable en pending_confirmation/pending_payment (API y UI).
- Colores: se guardan en hex; para mostrarlos al cliente usar `colorName()` (`src/lib/colorName.ts`) y en SQL `wa_color_name()`
  (misma paleta en los dos: cambiarlos juntos).
- Precios: `formatPrice()` → "200.00 CUP" (mismo formato que tarjetas y WhatsApp). Enlaces WhatsApp: `api.whatsapp.com/send`, no `wa.me`.
- Cada cambio de `order_status` dispara un WhatsApp al cliente: para saltar varios pasos usar un solo UPDATE (ver mark-paid `deliver`).

## Pendiente conocido (decidido dejarlo para despues)
- P3-05 parcial: el select del carrito logueado sigue trayendo `description` (la tarjeta del carrito la muestra);
  no hay store unico con updates optimistas.
- Catalogo offline (SW StaleWhileRevalidate de paginas de producto): segundo paso.
- `data-dgst` intermitente en la 1a peticion a `/shop` tras un deploy (visto 1 vez en prod y 1 en local; no se reproduce en 15+ intentos).
  Hipotesis: fallo de red puntual de GraphQL durante el SSR de componentes cliente con urql `suspense` → Next pasa a render
  en cliente y la pagina se ve bien. `retryExchange` ya reintenta. Si vuelve: mirar los logs de la funcion en Vercel.
  2026-10-04: mismo patron visto 1 vez con `next start` local: la 1a consulta GraphQL del servidor recien arrancado fallo
  (el menu mostro "Pareos" por el respaldo de `filterVisibleCollections`). No se repitio en 3 arranques en frio. Ahora se
  registra como "Visible collections check failed: <motivo>" en los logs: buscar eso en Vercel para ver la causa.
- Validar IOS-01 (boton WhatsApp tras pedir) en un iPhone fisico.
- Probar "Pagada y entregada" con el primer pedido real (no se ejecuto en QA para no mandar WhatsApp).
- Anexos sin hacer: SN-03 (aviso al cliente cuando el admin fija el envio), SN-09..11, IOS-04..09, MPC-09..11, CSA-5/8/9/10,
  P0-05 (monitor OpenWA), P0-10 en reset-password/AccountClient, P2-05/P2-07.

## Lecciones operativas
- `next build` con `next dev` corriendo en la misma carpeta rompe el `.next` del dev (500/404): parar el dev, compilar, relanzar `next dev -p 3001`.
- El hook pre-commit (prettier) deja todos los archivos "modificados" solo por finales de linea (CRLF/LF, `core.autocrlf=true`).
  Comprobar con `git diff --ignore-cr-at-eol --quiet`. **No** limpiar con `git checkout -- .` si hay cambios sin commitear en
  otros archivos (asi se perdieron una vez las notas de la Fase 3): commitear todo junto o limpiar solo rutas concretas.
  Ademas el hook formatea DESPUES de preparar el commit: correr `npx prettier --write` sobre los archivos tocados antes de
  `git add`, o commitear el formato que quede como `style:`.
- Playwright: el clic fantasma de Radix Select solo aparece con `tap()`; para movil usar un contexto con `isMobile`, `hasTouch`
  y DPR 2.75 (el navegador por defecto es de escritorio con hover).
- Pruebas con escritura en prod: usuario QA creado con la admin API (`DATABASE_SERVICE_ROLE`) y borrado al final; no enviar
  pedidos si no hace falta (cada pedido dispara WhatsApp a los admins).

## Historial resumido
- 2026-10-02: QA y plan. 2026-10-03: P0-01..P0-04 + borrado de datos QA (BD = baseline).
- 2026-10-04: Fase 0 en main (incidente tras 0018: `/admin/orders` 404 porque `urql-service.ts` no mandaba Bearer; arreglado en cbb7aa5),
  Fase 2, Fase 1 (6cac576), P1-15 (c875676/77b1d26), Fase 3 (20bc0bc), Fase 4 (2b04b7e), Fase 5 (ver git log).
