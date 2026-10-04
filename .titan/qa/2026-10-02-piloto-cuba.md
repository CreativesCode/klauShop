# QA pre-piloto Cuba — evidencia (2026-10-02)

Plan de correccion: `.titan/plans/qa-piloto-cuba-2026-10-02.md`
Datos QA creados en produccion (para limpiar): `.titan/qa/2026-10-02-datos-qa-ledger.jsonl` (121 lineas: 52 pedidos, 20 productos, 12 auth users, 4 perfiles, 8 medias, 2 zonas, 1 coleccion, etc.)

> Las capturas y scripts se guardaron en el scratchpad temporal de la sesion (`scratchpad/qa/shots/<persona>/`, `scratchpad/qa/<persona>/*.js`)
> y **no** se conservan. Abajo se resume lo que mostraban.

## Entorno

- Dev `next dev` en :3001; build de produccion `next start` en :3002 (worktree HEAD 2625165); prod `https://klau-shop.vercel.app` (solo lectura, mas un cambio de precio a un producto QA).
- **La BD es la de produccion** (DATABASE_URL, pooler Supavisor :6543, limite de 200 clientes). El MCP de Supabase no estaba autenticado (OAuth); se uso node+postgres.
- Red emulada: Pixel 5 (DPR 2.75), CDP 400 ms / 50 KB/s bajada / 20 KB/s subida, CPU x4. Cortes con `context.setOffline` y `route.abort`.
- WhatsApp de prueba solo a +5353077035. Admin: admin@klaushop.com.
- Metodologia: 7 personas; cada hallazgo lo verificaron 2 revisores escepticos de forma independiente. 123 hallazgos confirmados y 0 refutados.

## Observaciones de entrega de WhatsApp (OpenWA)

- `net._http_response`: **100% de status 500** `{"statusCode":500,"message":"Internal server error"}`. La cuenta crecio durante la sesion (8 → 53 → 68 → 107 → 123 → 129 → 136 filas, de 2026-10-02 22:32Z a 2026-10-03 ~02:00Z) y nunca hubo un 2xx.
- Llamadas directas a OpenWA (fuera de la BD):
  - `/health` → 200.
  - `GET /sessions/<sid>` (sesion `robert-us`, telefono 15753180319, pushName "Agente Virtual") → 200, `status: ready`, pero `lastActive` congelado en **2026-10-01T18:45Z**.
  - `/sessions/<sid>/status` → `{"statuses":[]}`.
  - `send-text` → 500 con cualquier chatId (`5353077035@c.us`, sin sufijo, `+53…`, el propio numero de la sesion).
  - Body vacio → 400, API key erronea → 401. Esto confirma que el payload y la autenticacion son correctos y que el fallo es interno de OpenWA.
- El SQL de la app esta bien: `wa_phone_to_chat_id('+5353077035')` = `5353077035@c.us`, las cuatro claves de `private_config` existen y la URL es `<base>/sessions/<sid>/messages/send-text` con `X-API-Key`.
- Host compartido (alucard-openws.duckdns.org) con otra sesion (`vitis-bot`); la key de private_config da acceso a ambas.
- Segun la memoria (`reference/whatsapp-openwa.md`), el envio funcionaba el 2026-09-24, asi que es una **regresion externa**.
- Intentos directos de diagnostico a +5353077035 (todos con 500 y ninguno entregado): ~10 en total entre revisores.
- Efectos colaterales en la app:
  - Cada pedido duplicado (P0-06), cada pedido basura de `/api/create-checkout-session` (P0-09) y cada pedido QA disparo el trigger de WhatsApp. Ninguno llego por el 500.
  - El checkout del cliente sigue abriendo wa.me, que no depende de OpenWA. Hoy es el unico canal vivo, y la confirmacion no ofrece un boton para reintentarlo (P1-02).
- Mensaje wa.me: la URL de la app esta bien codificada (`%F0%9F%9B%8D…`), pero la redireccion 302 de `wa.me` → `api.whatsapp.com/send/` convierte 🛍️ y 📋 en `%EF%BF%BD`. Llamar directamente a `api.whatsapp.com/send` devuelve 200 sin redireccion.

## Metricas por persona

### guest-mobile-buyer (invitado, Pixel 5, 3G)

| Medida | Valor |
|---|---|
| Ruta minima landing→pedido (producto con 3 variantes) | ~19 toques, 6 pantallas |
| Campos del checkout | 3 obligatorios + 2 opcionales; 0 para el invitado que vuelve |
| Prod 3G: home en frio | 746 KB / 48 req, FCP 11.1 s, load 18.2 s |
| Prod: /shop · PDP · carrito | 188 KB FCP 5.1 s · 96-205 KB FCP 1.5-3.2 s · 56 KB FCP 0.55 s |
| Prod: home en caliente | 84 KB |
| Imagen principal del PDP | w=2048 para un hueco de 361 px; tarjetas w=828 para 173 px |
| `/api/shipping-zones` en prod | X-Vercel-Cache HIT, Age 633939 s (~7.3 dias) |
| Zonas al abrir el dialogo | 3 GET paralelos (2 en prod + 1 de StrictMode) |
| check-stock por toques de variante | 4 toques = 4 POST (~1.5 s c/u en prod) |
| Cookie `cart` | 288 B con 3 lineas, duplicada en path=/shop y path=/ |
| Desfase de redondeo | carrito 7109.98 frente a 7109.97 cobrado |

Evidencia clave (resumen de capturas):
- Toast "Error / Failed to fetch" con el dialogo abierto tras perder la respuesta.
- Pedidos duplicados `kk49vqjmjcuaqb34jjf3njbb`/`iqkmnzfbmy6i082unzj6zuvj` y `fqirudyfcvduwud57lkv3gfs`/`nemxurzcmbq8q4hvm6yyrvq2`.
- Atras tras el pedido vuelve a /cart con 9 productos y "Continuar con WhatsApp" activo.
- Carrito con 10 ids: cabecera "10 productos", 8 lineas y subtotal sin 6500 CUP.
- Telefono `1234` aceptado y `5353077035` → `+53 5353077035`.
- Selector de zona en "Otro / no aparece" durante 4-10 s con "Envio por definir".

### registered-customer

| Medida | Valor |
|---|---|
| auth.users sin profiles (inicio) | 4 de 5 (luego 9 de 14 con los usuarios QA) |
| Checkout con direccion guardada | 2 clics desde el carrito |
| Checkout registrado sin direcciones | 7 controles frente a 5 del invitado |
| Red Cuba con la pagina ya cargada | dialogo listo 40.5 s, POST 63 s, confirmacion 70 s (dev cargado) |
| Peticiones al abrir el dialogo | 5; carts con join ×2; zones y addresses en cada apertura |
| Invitado: GET /auth/v1/user | 403 en cada carga |
| Usuario sin avatar | GET /avatars/01.png → 404 HTML de 3-6 KB por pagina |
| Anadir 1 unidad (logueado) | 3 POST check-stock |
| Sin perfil | /api/addresses → 500 FK address_userProfileId…; checkout → 500 FK orders_user_id… |

Evidencia:
- El merge del carrito al iniciar sesion da 400 PGRST204 "Could not find the 'productId' column".
- `/order/<propio>` → 307 `/admin/orders/<id>` → portada.
- IDOR: `/orders/q6vqjn2typasuyjbcllfof9a` (invitado) → 200 con datos de envio.
- `/wish-list` muestra "Please sign in…" mientras `getUser()` no responde, y se queda asi para siempre si se aborta.

### admin-orders

| Medida | Valor |
|---|---|
| Clics por orden manual | 7 (sin variantes) a 12 (+4 campos de texto) |
| Ciclo completo confirmar→entregado | 10 clics + 1 para abrir; en movil, scroll hasta y≈1100 de 2074 px por accion |
| Hueco entre el 200 del API y la UI (dev) | 2-10 s (hasta 20 s) con botones del estado viejo habilitados |
| Conexiones al pooler del dev server | 122-186 (limite 200) → EMAXCONN en change-status/cancel |
| Prod /admin/orders (red Cuba) | 5.4 s, 16 KB, 51 req; detalle 5.0 s / 78 KB; dashboard 3.3 s / 25 KB |
| Lista admin | sin paginacion en servidor (carga todos los pedidos + order_lines) |
| Dashboard vs SQL | ingresos 13.970 CUP, 6 ventas, envios 1020, 24 pendientes: cuadra |

Evidencia:
- KS-H2PF (`u1dxxen78rnbunqm38vxh2pf`): dos lineas pintadas en rojo cuando las reservas son #FF0000/S y #0000FF/M.
- Duplicados por 2o clic: KS-UNNT/KS-UG1Y y KS-UD5P/KS-NWE0.
- Navegacion cliente a la lista: "Todas (8)" frente a "Todas (62)" con F5 (entrada fetch-cache del 2026-09-24 con revalidate 31536000).
- Sesion caducada: 1a carga 500 "Cookies can only be modified…", 2a 200.
- Login antes de hidratar → `/sign-in?email=…&password=…`.

### admin-catalog

| Medida | Valor |
|---|---|
| /admin/collections/new (build prod) | 99 req GraphQL / 30 s (~18 MB/h); edicion 80 / 30 s; dev 1339 en 8 min |
| /admin/products/new | 2 req / 30 s (normal) |
| Compresion de subida | 7.3 MB → 952 KB WebP; 10.6 MB → 1.38 MB |
| Bucket klaushop | mediana 69 KB, media 236 KB, max 1.89 MB |

Evidencia:
- POST anonimo con `Next-Action` de updateProductAction → 200 y el precio del producto QA cambio (777 → 1200).
- El dialogo de imagen de la coleccion nunca abre.
- Al enviar el formulario de producto vacio solo aparece "Required" (en ingles).

### integrity-api

| Medida | Valor |
|---|---|
| Carrera por la ultima unidad | 10 POST → 1 x 201 + 9 x 409 (1 reserva) |
| Carrera stock 2 con colores | 8 POST → 2 x 201 |
| Checkout simple (dev) | 12.3 s; 409 en 3.5 s; en carrera 7.5-28.8 s (serializado por FOR UPDATE, ~2-3 s de lock en dev) |
| Reserva activa mas antigua | 2026-01-07 (pedido `j8oybiaeusddmxq0yl9ab424`, 1 ud "Tablet LCD para dibujo") |
| Pedidos de prod antes de la QA | 27, todos de invitado (user_id NULL) |

Evidencia:
- `pg_policies` en orders/order_lines: "Service role can manage all…" TO public USING true.
- anon con todos los grants.
- `/api/create-checkout-session` crea el pedido `pf6fm65w6avjd7pw53dwcrbp` con amount -260 y linea qty -2.
- Nota con U+202E se ve invertida en el admin.

### performance-connectivity (build prod :3002)

| Pagina | Frio | Repetida |
|---|---|---|
| Home | 1332 KB / 71 req (JS 658, img 588), FCP 5.6 s, LCP 7.2 s | 32 KB |
| /shop | 1504 KB / 82 req (JS 662, img 738), LCP 21.2 s | 49 KB |
| /shop/lego-250 | 969 KB / 65 req, LCP 32.3 s | 31 KB |
| /collections/bikinis | 813 KB, LCP 17.9 s | 129 KB |
| /cart (1 item) | 921 KB / 70 req (JS 690) | 27-29 KB |

- First Load JS del build: `/` 609 kB, `/shop` 614, `/shop/[slug]` 612, `/cart` 641, `/collections/[slug]` 618; compartido 87.6 kB.
- Chunks de admin en la tienda (gzip): recharts 111-113 KB, xlsx 91-92 KB, quill 45-46 KB + 16 KB, framer-motion+radix 54-55 KB, drizzle 48 KB, tanstack 32-43 KB.
- Hidratacion en 3G: "Add to Cart" visible a 0.7-1.0 s pero funcional a 22.8-24 s. El clic temprano navega a `?quantity=1`.
- GraphQL de 16 tarjetas: 30.1 KB / 9.0 KB gzip con description, frente a 9.4 / 2.7 sin ella. Una 2a consulta de autofill de 12-35 KB siempre.
- Offline: recargar → ERR_INTERNET_DISCONNECTED; navegar en cliente → `chrome-error://chromewebdata/`. Sin service worker ni manifest.
- Data Cache: 11-44 entradas GraphQL con revalidate=31536000. Producto QA a 1000 CUP siguio mostrando 1000 con la BD en 1234/1500/stock 0 (200 con "Add to Cart").

### code-audit-refresh

- Prod (Pixel 5, comprimido): `/` 1402 KB (JS 656 / 41 scripts, img 671), `/shop` 1562 KB, `/shop/set-bags` 870 KB, `/cart` 887 KB (JS 689).
- Cambios de precio en la BD 100 → 150 → 120 → 130 → 140: dev siguio mostrando 100 y prod 120. Prod dio 404 persistente para un producto repuesto tras pasar por stock 0.
- 0 llamadas `revalidatePath`/`revalidateTag` en `src/`.
- /cart logueado (dev): 10 GET `/rest/v1/carts` con join (en prod se estiman 3).
- Pedido invitado KS-3X96: el carrito mostro 120, se cobro 120 y la ficha mostraba 100. Despues, el carrito siguio lleno.

## Observaciones fuera del alcance de un hallazgo

- `customer_data` esta guardado como string JSON doblemente codificado (`json_typeof = 'string'`); los reportes SQL deben tenerlo en cuenta.
- Hay FKs duplicadas en `orders.user_id` (`orders_profiles_fk` y `orders_user_id_profiles_id_fk`) y en `comments`.
- Coleccion real "Pareos" con 0 productos visible en los menus.
- Typo en el dato real: "Lapices Flexibles y Doblabes".
- La memoria `riesgos-detectados-2026-09-24` (#3 y #4, "codigo listo sin deploy") esta superada: en prod el disponible ya se calcula por producto dentro de la transaccion.
