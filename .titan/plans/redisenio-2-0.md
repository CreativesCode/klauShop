# Rediseño Klau's Shop 2.0 — plan y estado

> Fuente: `docs/design/design_handoff_klaushop_redesign/` (README, docs/01–05, snippets, mocks `design/*.dc.html`).
> El handoff es la especificación; este archivo registra el avance, las decisiones y los pendientes.
> Pedido del dueño (2026-10-20): aplicar el rediseño a TODAS las vistas siguiendo los patrones, sin romper nada
> de lo que funciona (en especial en iPhone).

## Estado (2026-10-20)

Commits locales en `main`, **sin push** (cada fase deja el sitio funcionando; lint + 66 tests OK en cada una):

| Fase | Commit | Estado |
|---|---|---|
| 0 Fuentes + tokens + siteConfig + logo recortado | `7f5817a` | Hecha |
| 1 Componentes base (button, badge, card, input, select, textarea, toast, formatCUP, StatusPill, ProductCard, QuickAdd) | `f3a833b` | Hecha |
| 2 Shells (tienda: anuncio, header sticky 2 filas, tab bar móvil, footer; admin: sidebar agrupado, topbar, tab bar + "Más") | `a8965bf` | Hecha |
| 3 Pantallas clave tienda (inicio, ficha, carrito) | `4bed0ab` | Hecha |
| 3 Pantallas clave admin (dashboard, órdenes, detalle de orden) | `26f121d` | Hecha |
| 4 Propagación — tienda parte 1 (Shell, colección, filtros, búsqueda, favoritos, mis órdenes, detalle cliente) | `fd95b1c` | Hecha |
| 4 Propagación — tienda parte 2 (confirmación, encargos, sobre nosotros, ajustes, direcciones, 404) | `59d6110` | Hecha |
| 4 Auth (AuthCard compartida; PasswordInput a 46px/16px) | `3f79369` | Hecha |
| 4 Admin productos (lista + formulario en tarjetas) | `08c847e` | Hecha |
| 4 Admin colecciones | `d791852` | Hecha |
| 4 Admin multimedia | `33447a4` | Hecha |
| 4 Admin usuarios (y copy en inglés traducido) | `4f8e658` | Hecha |
| 4 Admin zonas de envío | `e88d0ec` | Hecha |
| 4 Admin nueva orden | `e53c896` | Hecha |
| Textos en inglés (carousel, multi-select) | `8ea5599` | Hecha |
| Usuarios admin: editar guarda, lista completa, crear sin `role: "ADMIN"` | `8b41c2b` | Hecha |
| Código muerto eliminado | `44790f6` | Hecha |
| Handoff `docs/design/` en el repo | `1f67ab7` | Hecha |
| Carrito como panel lateral | `aab2b72` | Hecha |
| Fix clase ambigua `duration-[600ms]` (choca con tailwindcss-animate) | `5830abf` | Hecha |
| **Push a `main` = deploy a producción** (dueño aprobó) | `5163ca9..5830abf` | Hecho 2026-10-20 |
| Comprobaciones finales | — | Smoke test en prod OK; Lighthouse oficial pendiente (ver abajo) |

### Pendiente
- [ ] Lighthouse oficial: la API de PageSpeed sin clave agotó la cuota diaria y no se instaló Lighthouse en local
      (descarga de paquete, pedir permiso). Medición propia en prod (Chromium, viewport iPhone, SIN throttling, así que
      optimista): LCP / 1,3 s · /shop 2,1 s · ficha 1,3 s · /cart 0,9 s · /sign-in 1,0 s; CLS 0 (sign-in 0,017);
      `lang="es"`; ninguna imagen sin `alt`; ningún texto < 11px.
- [ ] Probar con una sesión admin real guardar un usuario editado (no se probó: modificaría datos de producción).

### Hallazgos resueltos (pedido del dueño 2026-10-20)
- Editar usuario no guardaba (submit comentado) → `updateUserAction` (nombre, correo, contraseña opcional; sincroniza
  `profiles`). `listUsers` solo traía 10 → pagina todo. `createUser` mandaba `role: "ADMIN"` (no es un rol de
  Postgres) → quitado; la cuenta se crea confirmada y el admin se da con "Hacer administrador".
- Borrados: `FilterSheet`, `CartSheet`, `ShipReturns`, `RecentSales`, `AdminUserNav`, `data-table-toolbar`.

### Patrones nuevos de la Fase 4
- Listas admin: `components/admin/AdminTable.tsx` → `AdminSearchField`, `adminChip(active)`, `AdminTableView`
  (tabla ≥ lg + `renderMobileRow` para tarjetas en móvil) dentro de la tarjeta `rounded-[18px] border-line bg-white`,
  con `DataTablePagination itemLabel`.
- Formularios admin: tarjetas `flex-[2_1_520px]` / `flex-[1_1_320px]` y barra fija
  `sticky bottom-[calc(65px+env(safe-area-inset-bottom))] lg:bottom-0` (queda justo encima de la tab bar admin).
- Auth: `AuthCard` de `@/features/auth`.

## Decisiones tomadas (avisar al dueño)
- **Manrope sale de `@fontsource/manrope` (archivos estáticos por peso) con `next/font/local`**, no de Google: Google
  solo sirve Manrope variable y WebKit sin soporte de fuentes variables (iOS viejos; también el WebKit de Playwright en
  Windows) lo pinta todo en ExtraLight. Instrument Serif sí viene de `next/font/google` (es estática).
- **El admin ya no fija `html{font-size:14px}`**: el diseño usa px sobre la base de 16px de Tailwind.
- **Precios en UI con `formatCUP()` ("4.500 CUP", sin decimales)**; WhatsApp, JSON-LD, metadata y exportaciones siguen
  con `formatPrice()` / `toFixed(2)`.
- **Carrito como panel lateral (`CartDrawer`, dueño dijo que sí).** Los botones del carrito del header lo abren
  (siguen siendo enlaces reales a `/cart`). Muestra líneas, cantidades, subtotal y total. Su botón principal va a
  `/cart?checkout=1`, que abre el diálogo de entrega al llegar: el checkout de WhatsApp sigue corriendo solo en `/cart`
  (el flujo probado en iOS), sin diálogo anidado en el panel. La acción "Ver carrito" del toast abre el panel.
- Tarjeta de producto: botón "Añadir al carrito" si el producto no tiene variantes; "Elegir opciones" (lleva a la ficha)
  si tiene talla/color/material.
- `MaterialSelector` usa chips como la talla (antes Radix Select, el del "clic fantasma" en iOS).
- Selector de filas por página de las tablas: `<select>` nativo (16px en móvil).
- Buscador del topbar admin → `/admin/orders?search=` (no hay búsqueda global). La campana enlaza a pendientes.
- Órdenes admin: tabs/filtros en la URL (`?status=pending|pending_confirmation|…`, `?shipping=pending`, `?zone=`,
  `?search=`). Acción masiva solo "Marcar como enviadas" (solo transiciones válidas, con confirmación: cada cambio manda
  WhatsApp). El "Exportar" de la barra de selección no se hizo; "Exportar" del encabezado usa el export del mes.
- El "Eliminar" de la fila de órdenes se movió al detalle (como pide el handoff).
- `siteConfig`: eliminados `url/address/phone/email/mainNav` de la plantilla (no se usaban).
- Logo del header: `public/imagotipo_horizontal_tight.svg` con viewBox `32 32 376 176` (el sugerido por el handoff
  cortaba el círculo).

## Cómo verificar el admin en local (sin credenciales)
La cuenta admin de la QA es real y de producción: no se usa su contraseña. Para capturas se aplicó un parche temporal
(nunca commiteado) que salta el guard de admin solo con `NODE_ENV=development` y `ADMIN_UI_PREVIEW=1`. Antes de cada
commit se excluyeron los dos layouts; al parar se revirtió. Comprobar siempre con
`git grep TEMP-ADMIN-PREVIEW HEAD -- src` (debe salir vacío) y, para el árbol de trabajo, `grep -rn TEMP-ADMIN src`
(`git grep` sin `HEAD` no lo detectó con las rutas con paréntesis). Si `git apply -R` falla por CRLF, los dos layouts
solo contienen el parche: `git checkout --` de ambos.

## Aprendizajes
- Antes de cada push: `npm run build` (para el dev server antes: comparte `.next`). Los avisos "Dynamic server usage"
  de `/api/admin/dashboard/export` son informativos y vienen de antes.
- El conector de Vercel de esta máquina es de otra cuenta (no ve klauShop): el deploy se verifica contra
  https://klau-shop.vercel.app buscando una marca de la versión nueva en el HTML.
- Tras borrar archivos, `next dev` puede quedar con caché rota ("Failed to read source code"): parar el proceso de
  node (TaskStop no siempre lo mata) y arrancar de nuevo.
- Los heredocs con comillas raras fallan en el Bash de esta máquina: escribir scripts/fragmentos con la herramienta Write
  y empalmar con un script Python.
- En CSS grid sin `grid-cols-1`, la columna implícita crece con el contenido y provoca scroll horizontal en móvil.
- Diálogos (Radix portal) dentro de un `<Link>`: sus eventos burbujean al Link → mantener los botones con diálogo fuera
  de los enlaces.
- Las capturas del admin con `networkidle` no terminan nunca (peticiones abiertas): usar `load` + espera.
- Subconsultas en `sql\`\`` de Drizzle: usar nombres de columna literales calificados (`"orders"."id"`).
