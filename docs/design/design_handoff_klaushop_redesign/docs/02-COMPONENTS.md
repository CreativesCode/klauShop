# 02 · Componentes base

Cada componente indica: archivo destino, anatomía, medidas exactas, estados, y clases Tailwind sugeridas. Implementa estos **antes** de las pantallas: casi todo el sitio los consume.

---

## Button — `src/components/ui/button.tsx`
Código: `snippets/button.tsx`.

| Variante | Fondo | Texto | Borde | Hover | Uso |
|---|---|---|---|---|---|
| `default` (primario) | `#6D28D9` | `#fff` | — | `#5B21B6` | Acción principal. Añade sombra `shadow-[0_8px_24px_-8px_rgba(109,40,217,.55)]` solo en tamaños `lg`/`xl` de tienda |
| `dark` (nuevo) | `#111827` | `#fff` | — | `#2E1065` | Carrito en header, "Guardar envío", filtros activos |
| `outline` | `#fff` | `#111827` | `1px #D1D5DB` | borde `#111827` | Secundaria ("Ver toda la tienda", "Encargos…") |
| `outlineDark` (nuevo) | transparente | `#111827` | `1.5px #111827` | fondo `#111827`, texto blanco | "Preguntar por WhatsApp" en ficha |
| `accent` (nuevo) | `#F59E0B` | `#111827` | — | `#FBBF24` | WhatsApp/encargos |
| `soft` (nuevo, admin) | `#F3F2F7` | `#111827` | — | `#ECEAF3` | Acción secundaria en tablas |
| `destructiveSoft` (nuevo) | `#fff` o `#FEF2F2` | `#B91C1C` | `1px #FECACA` | `#FEF2F2` | Cancelar orden |
| `ghost` | transparente | hereda | — | `#F4F2F8` (tienda) / `#F5F3FF` (admin) | Iconos, nav |
| `link` | — | `#5B21B6` | — | underline | |

| Size | Alto | Padding X | Fuente | Radio |
|---|---|---|---|---|
| `sm` (admin fila) | 32–34px | 12px | 12px / 800 | 9–10px |
| `default` (admin) | 40px | 16px | 13px / 800 | 10px |
| `lg` (tienda) | 48px | 22–26px | 15px / 700 | full |
| `xl` (tienda CTA) | 52–54px | 24–26px | 15–16px / 800 | full |
| `icon` | 40–44px cuadrado | — | — | full (tienda) / 12px (admin) |

Base: `inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100 disabled:opacity-50 disabled:pointer-events-none`.
Implementación recomendada: añade una prop/variante `shape: "pill" | "rounded"` o usa los tamaños para decidir el radio (`lg`/`xl` → `rounded-full`; `sm`/`default` → `rounded-[10px]`). Hoy `outline` hace `hover:bg-accent/20` (ámbar) → quitarlo.

Deshabilitado especial: el botón "Confirmar orden" cuando falta el envío usa fondo `#C4B5FD` + `cursor-not-allowed` y un aviso encima (ver Detalle de orden).

---

## Badge — `src/components/ui/badge.tsx`
Código: `snippets/badge.tsx`. Píldora: `rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-extrabold tracking-[.02em]`, sin borde por defecto.

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| `new_product` ("Nuevo") | `#fff` (sobre imagen) / `#F5F3FF` (sobre blanco) | `#5B21B6` | Antes `#ff0000` |
| `best_sale` ("Mejor venta") | `#111827` | `#fff` | Antes rojo |
| `featured` ("Destacado") | `#fff` + borde `#DDD6FE` | `#5B21B6` | Antes rojo |
| `discount` (nuevo, "-10%") | `#F59E0B` | `#111827` | Antes `bg-red-500` |
| `count` (nuevo) | `#F59E0B` | `#111827` | Contadores de nav/carrito: `min-w-[18–22px] h-[18–22px] px-1.5 text-[10–12px] font-extrabold` |

Textos: "Nuevo", "Mejor venta" (minúscula en "venta"), "Destacado".

### StatusPill (nuevo) — `src/features/orders/components/StatusPill.tsx`
Código: `snippets/StatusPill.tsx`. `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap` + punto `size-1.5 rounded-full bg-current`. Colores en `01-TOKENS.md`. Usar en: tabla de órdenes, detalle, dashboard, órdenes del cliente (`OrdersList.tsx`, `orders/[orderId]`). Pill auxiliar "⏱ Hace N días" (`bg-orange-50 text-orange-700 text-[11px] font-extrabold`) para pendientes > 48 h (lógica `getStalePendingDays` ya existe en `OrdersColumns.tsx`).

---

## Input — `src/components/ui/input.tsx`
- Alto 46px, `rounded-xl` (12px), borde `1px #D1D5DB`, padding X 14px, **`text-base` (16px) en móvil**, `md:text-sm` permitido en admin desktop.
- Foco: `focus:border-primary focus:ring-4 focus:ring-primary-100 outline-none`.
- Error: borde `#FCA5A5` + mensaje `text-[13px] font-bold text-red-700` debajo.
- Label: `text-[13px] font-bold mb-1.5`. Ayuda: `text-xs text-neutral-500`.

### SearchField (tienda) — `SearchInput.tsx` / `MobileSearchInput.tsx`
- Desktop: `h-11 rounded-full bg-[#F4F2F8] px-4 gap-2.5`, icono search 18px `#6B7280`, placeholder "Buscar vestidos, juguetes, accesorios…", `max-w-[560px] flex-1`. Foco: `bg-white border-primary-300`.
- Móvil: segunda fila del header, `h-11 rounded-xl bg-[#F4F2F8]`, placeholder "Buscar en Klau's Shop", 16px. **Siempre visible** (hoy es un icono que abre un input).

### SearchField (admin)
`h-[42px] rounded-xl bg-white border border-[#E7E4EF] max-w-[440px]`, placeholder "Buscar órdenes, productos, clientes…", hint `⌘K` en desktop (`text-[11px] font-bold border rounded-md px-1.5`). En listas: `h-10 rounded-[10px] bg-[#F6F5FA]` sin borde.

---

## Card — `src/components/ui/card.tsx`
- Quitar `shadow-sm`. `rounded-[18px] border border-[#ECEAF3] bg-white`.
- `CardHeader`: `p-5` (20px) y título `text-[15px] font-extrabold leading-tight` (hoy `CardTitle` es `text-lg md:text-2xl font-semibold` → demasiado grande para admin). Crea variante o sobreescribe en admin.
- `CardContent`: `p-5 pt-0`.

---

## Chip / Segmented
- **Chip filtro** (zonas, filtros de órdenes): `h-8–9 px-3 rounded-full border text-xs font-bold`. Inactivo `bg-white border-[#E5E7EB] text-neutral-700`; activo `bg-ink border-ink text-white`.
- **Segmented** (pestañas de productos en home, rango de fechas del dashboard): contenedor `p-1 rounded-full bg-[#F1EEF7]` (tienda) o `p-[3px] rounded-xl bg-white border border-[#E7E4EF]` (admin). Opción `h-[38px] px-4 rounded-full` / `h-[34px] px-3.5 rounded-[9px]`, 13–14px/700. Activa tienda: `bg-white text-ink shadow-[0_1px_3px_rgba(17,24,39,.12)]`; activa admin: `bg-ink text-white`. Inactiva `text-neutral-500`/`text-neutral-600`.
- **Tabs con contador** (estados en Órdenes): `h-[52px] px-3 border-b-2`, activa `border-primary text-ink`, contador `rounded-full min-w-[22px] h-5 text-[11px] font-extrabold` (activo `bg-primary text-white`, "Pendientes" inactivo `bg-amber-100 text-amber-800`, resto `bg-[#F3F2F7] text-neutral-600`). Contenedor `overflow-x-auto no-scrollbar`.

---

## ProductCard — `src/features/products/components/ProductCard.tsx`
**Mantén el fragment GraphQL y la lógica de descuento/hover-image tal cual.** Cambia solo el JSX.

Anatomía (de arriba a abajo), `flex flex-col gap-3 min-w-0`, **sin Card/borde/sombra**:
1. **Media** `relative aspect-[4/5] rounded-[18px] overflow-hidden bg-[#F1EEF7]` (antes 1:1).
   - Imagen `object-cover`, hover `group-hover:scale-[1.04] duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)]`. Mantén la segunda imagen en hover (`[@media(hover:hover)]`).
   - Badges arriba-izquierda `top-2.5 left-2.5 flex flex-col items-start gap-1.5`: primero insignia (Nuevo/Destacado/Mejor venta), debajo descuento `-10%`.
   - Favorito arriba-derecha `top-2 right-2 size-10 rounded-full bg-white/90` con corazón 19px; activo relleno `#6D28D9`.
   - **Botón "Añadir al carrito"** (nuevo) abajo `left-2 right-2 bottom-2 h-[42px] rounded-xl bg-ink/90 text-white text-[13px] font-bold`, icono `+`; hover `bg-primary`. Tras añadir muestra "Añadido ✓". Si el producto tiene tallas/colores obligatorios, este botón debe **navegar a la ficha** en lugar de añadir (o abrir un selector rápido); si no tiene variantes, usa `AddToCartButton`. En dispositivos táctiles se muestra siempre (como en el mock); en desktop puedes mostrarlo solo en hover (`opacity-0 group-hover:opacity-100`), opcional.
2. **Categoría** `text-xs font-semibold uppercase tracking-[.06em] text-neutral-500` (link a colección).
3. **Nombre** `text-[15px] font-semibold leading-[1.35] text-ink line-clamp-2 hover:text-primary`.
4. **Precio** `text-base font-extrabold tabular-nums` + precio anterior `text-[13px] text-neutral-500 line-through` (formato `formatCUP`). Precio con descuento **ya no es rojo**: es `ink` y el descuento lo comunica la badge ámbar.
5. **Stock + tallas** una línea `text-xs font-semibold`: punto 6px `bg-current` + texto. `stock<=1` → "Última unidad" `#B45309`; `<5` → "Quedan N" `#B45309`; resto "En stock" `#047857`. Seguido de `· Tallas L · M` en `text-neutral-500 font-medium` si hay tallas.
- **Eliminar**: puntos de color, chips de tallas, `text-[10px]`, `text-primary-800` en el nombre, colores rojos.

Skeleton (`ProductCardSkeleton.tsx`): bloque 4:5 `rounded-[18px]` + 3 líneas (40%, 90%, 30%).

Grid de productos (home, colecciones, búsqueda, wishlist, recomendaciones):
`grid gap-x-3 md:gap-x-6 gap-y-6 md:gap-y-10 grid-cols-[repeat(auto-fill,minmax(max(156px,calc((100%-72px)/4)),1fr))]` (equivale a 2 col en móvil, 3 en tablet, 4 en desktop).

---

## Section heading (tienda) — `src/components/layouts/SectionHeading.tsx` / `Header.tsx`
`flex items-end justify-between gap-4 mb-5`: H2 `text-[clamp(22px,2.2vw,30px)] font-extrabold tracking-[-0.02em]` + descripción opcional `text-[15px] text-neutral-500 mt-1.5`; a la derecha link "Ver todo →" `text-sm font-bold text-primary-700` o un segmented.

---

## Perk strip (tienda)
Rejilla `grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-px bg-[#EEEAF6] border border-[#EEEAF6] rounded-[18px] overflow-hidden`; celdas `bg-white px-[18px] py-4 flex items-center gap-3.5`; icono en `size-10 rounded-xl bg-primary-50` con icono 20px `#6D28D9`; título 14/700, texto 13px `#6B7280`.
Contenido: Envío a domicilio · "4 municipios de Villa Clara" / Pedido por WhatsApp · "Te confirmamos en minutos" / Revisado antes de entregar · "Calidad / precio garantizada" / Encargos · "Shein, Temu y Amazon". Iconos: truck, message-circle, badge-check, package-search.

---

## StatCard (admin, nuevo) — `src/components/admin/StatCard.tsx`
Código: `snippets/StatCard.tsx`. `rounded-[18px] border border-[#ECEAF3] bg-white p-[18px] pb-3.5 flex flex-col gap-2.5`.
- Fila 1: label `text-[13px] font-bold text-neutral-500` + delta pill `rounded-full px-2 py-[3px] text-xs font-extrabold` (sube: `bg-emerald-50 text-emerald-700` "↑ 12.4%"; baja: `bg-red-50 text-red-700` "↓ 4.2%"; sin dato previo: "—" `bg-[#F3F2F7] text-neutral-500`).
- Valor `text-[clamp(22px,2vw,28px)] font-extrabold tracking-[-0.02em] tabular-nums` + unidad `text-sm font-bold text-neutral-500 ml-1` ("CUP").
- Sparkline SVG 100×28 `preserveAspectRatio="none"`, h-[34px], línea `#6D28D9` 1.6px `vector-effect: non-scaling-stroke`, área `rgba(109,40,217,.08)`.
- Pie `text-xs text-neutral-500`: "vs. período anterior · 165.836 CUP".

## AttentionCard (admin, nuevo)
Link `flex items-center gap-3 p-3.5 rounded-[14px] border` con fondo tintado por tipo; icono en caja blanca `size-[38px] rounded-[11px]`; número `text-[22px] font-extrabold` en el color del tipo; label `text-[13px] font-semibold text-neutral-700`; chevron-right `#9CA3AF`. Hover `-translate-y-px`.
Tipos: Por confirmar (yellow-50 / border yellow-200 `#FEF08A` / yellow-700, icono clock), Esperando pago (orange-50 / orange-200 / orange-700, credit-card), Productos sin stock (red-50 / red-200 / red-700, package-x), Envío sin costo definido (primary-50 / primary-200 / primary-700, truck).

---

## SidebarNav (admin) — `src/components/admin/SidebarNav.tsx` + `src/config/dashboard.ts`
- Aside `sticky top-0 h-screen w-[248px] (colapsado 72px) border-r border-[#ECEAF3] bg-white px-3 py-4 flex flex-col transition-[width]`.
- Marca: isotipo 34px + "Klau's Shop" 15/800 + "Administración" 12/600 `#6B7280`, alto 48px, `mb-3`.
- Grupos (añadir `group` a `SidebarNavItem` o una estructura `sidebarGroups`): **General** (Dashboard, Órdenes), **Catálogo** (Productos, Colecciones, Multimedia), **Clientes y envíos** (Usuarios, Zonas de envío). Título de grupo `px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-neutral-500`. Gap entre grupos 18px.
- Ítem `h-10 px-2.5 rounded-[10px] gap-3 text-sm font-semibold`, icono 19px. Inactivo `text-neutral-700 hover:bg-primary-50`; activo `bg-primary-50 text-primary-700`. Activo = `pathname.startsWith(item.href)` (hoy es igualdad estricta → el ítem no se marca en `/admin/orders/123`).
- Contador en "Órdenes" = nº de `pending_confirmation` (badge `count`).
- Pie (separado por `border-t pt-3`): "Ver tienda" (icono store) y "Contraer menú" (panel-left-close / panel-left-open). Persistir colapsado en `localStorage` o cookie.
- Tema oscuro opcional (tweak del mock): `bg-[#1E1033] border-[#2E1A4D]`, texto `#DDD6FE`, activo `bg-[rgba(196,181,253,.16)] text-white`. No es requisito.

## AdminTopbar (nuevo)
`sticky top-0 z-30 bg-[#F6F5FA]/90 backdrop-blur-md border-b border-[#ECEAF3]`, contenido `max-w-[1400px] mx-auto px-4 lg:px-8 py-3 flex items-center gap-3`: (móvil: isotipo 32px) · buscador o breadcrumb · a la derecha botón campana `size-[42px] rounded-xl border bg-white` con punto ámbar y avatar `size-[42px] rounded-xl bg-primary text-white font-extrabold` (iniciales; abre `AdminUserNav`). En páginas de detalle: botón volver `size-[42px]` + breadcrumb "Órdenes / KS-1058".
**El admin deja de usar `MainNavbar adminLayout`** (revisa `src/app/(admin)/layout.tsx`).

## AdminTabBar (nuevo, < lg) — `snippets/AdminTabBar.tsx`
`fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-white/95 backdrop-blur border-t border-[#ECEAF3] px-1.5 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))]`. Ítems `h-[52px] flex-col gap-1 text-[11px] font-bold`, icono 22px; activo `text-primary`, inactivo `text-neutral-500`. Pestañas: Inicio (layout-dashboard), Órdenes (receipt, con contador), Productos (shopping-cart), Clientes (user), Más (menu → abre `Sheet` con Colecciones, Multimedia, Zonas de envío, Ver tienda, Cerrar sesión). El `main` añade `pb-[76px] lg:pb-0`.

## MobileTabBar (tienda, nuevo, < md) — `snippets/MobileTabBar.tsx`
Igual estructura, `grid-cols-4`: Inicio (house), Categorías (layout-grid → abre `SideMenu`), Favoritos (heart → /wish-list), Cuenta (user → /setting o /sign-in). El carrito queda en el header (arriba a la derecha) con contador. Ocultar en `/cart` y en la ficha de producto (allí hay barra de compra fija). `main` con `pb-[72px] md:pb-0`.

---

## Toast
Usa `sonner` o el toaster existente con estilo: `bg-ink text-white rounded-[14px] px-[18px] py-3 text-sm font-semibold shadow-[0_12px_32px_-8px_rgba(17,24,39,.4)]`, icono circle-check `#34D399`. Posición abajo-centro, `bottom-6` (o `bottom-[84px]` si hay tab bar). Texto: "Añadido al carrito".

## Empty / Notice
- Notice éxito: `rounded-xl bg-emerald-50 text-emerald-700 px-3.5 py-2.5 text-sm font-bold` + icono.
- Notice aviso: `rounded-xl bg-orange-50 text-orange-700 text-[13px] font-bold`.
- Empty: texto centrado `text-neutral-500 py-12 text-[15px]`.

## Reglas para pantallas no diseñadas (Fase 4)
- **Páginas de listado admin** (Productos, Colecciones, Usuarios, Multimedia, Zonas de envío): mismo patrón que Órdenes → título H1 + descripción + acciones a la derecha; tarjeta blanca con (tabs opcionales) + toolbar (buscador + chips) + tabla + paginación; en < lg filas → tarjetas. `AdminShell.tsx` pasa a ser ese encabezado (sin `border-b`, `mb-5`).
- **Formularios admin** (crear/editar producto, colección, zona): columnas `flex-wrap` principal (2fr, min 520px) + lateral (1fr, min 320px) como el detalle de orden; cada grupo de campos en su tarjeta con título 15/800 y descripción 13px; acción primaria arriba a la derecha y repetida abajo; en móvil barra fija inferior con "Guardar". Inputs 46px.
- **Páginas de tienda** (colección, búsqueda, wishlist): breadcrumb 13px + H1 sección + grid de ProductCard. Filtros (`FilterSheet`) en móvil como bottom sheet; en desktop chips encima de la rejilla. Banner de colección (`CollectionBanner.tsx`) = estilo de banner editorial (imagen + degradado + título serif).
- **Auth** (sign-in/up): tarjeta centrada `max-w-[420px] rounded-[28px] bg-white border p-8`, logo arriba, botones `xl` píldora, inputs 46px.
- **Órdenes del cliente** (`/orders`, `/orders/[id]`): StatusPill + stepper del detalle de orden (versión de solo lectura) → reutiliza el stepper en `OrderProgress.tsx`.
