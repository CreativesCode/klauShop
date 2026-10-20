# 03 · Pantallas

Medidas en px. "Móvil" = < md (tienda) / < lg (admin). Abre el `.dc.html` correspondiente mientras implementas: es interactivo (pestañas, carrito, acciones de orden funcionan).

---

## A. Tienda · Inicio — `design/Tienda Inicio.dc.html` → `src/app/(store)/page.tsx`

Orden de secciones (de arriba a abajo). Contenedor común: `max-w-[1320px] mx-auto px-4 md:px-6 xl:px-8`.

### A1. Barra de anuncio (en `(store)/layout.tsx`, encima del navbar)
`bg-[#2E1065] text-primary-100 text-[13px] font-medium py-[9px] text-center`, punto ámbar 6px + texto: "Envíos a domicilio en Santa Clara, Placetas, Encrucijada y Calabazar de Sagua" (usa `siteConfig.zones`). No es sticky.

### A2. Header (`MainNavbar.tsx` / `MobileNavbar.tsx` / `CategoriesSubNav.tsx`)
- `sticky top-0 z-40` (hoy `fixed` + `pt-[50px] md:pt-[114px]` en main → **cambiar a sticky** y quitar esos paddings), fondo blanco 86% + blur, borde inferior `#EEEAF6`.
- **Desktop fila 1** (`py-3.5 px-8 gap-8`): logo (alto visual ~44px) · buscador píldora flex-1 máx 560 · derecha `gap-1.5`: "Entrar" (ghost píldora 44px, icono user) — o `UserNav` si hay sesión —, favoritos (icono 44px, contador violeta si >0), **Carrito** (botón `dark` píldora 44px: icono shopping-bag + "Carrito" + contador ámbar 22px). El `SideMenu` (hamburguesa) desaparece en desktop: las categorías van en la fila 2.
- **Desktop fila 2**: categorías (`CategoriesSubNav`) en línea, `overflow-x-auto no-scrollbar`, links `px-3.5 pt-2.5 pb-3 text-sm font-semibold text-neutral-600 border-b-2 border-transparent hover:text-ink hover:border-primary`. Primer ítem "Ver todo".
- **Móvil fila 1** (`px-3 py-2`): hamburguesa 44px (abre `SideMenu`) · logo centrado (alto visual 40px) · carrito icono 44px con contador ámbar 18px. Fila 2: buscador `h-11 rounded-xl` full width, `px-4 pb-3`. (Hoy el móvil apila menú+búsqueda-icono+logo+user+carrito en una fila.)

### A3. Hero (`HeroSection`)
Dos variantes; **por defecto "Mosaico"**.
- Contenedor `pt-4 md:pt-8`, tarjeta `rounded-[clamp(20px,2.4vw,32px)] bg-[#FFF8EE] overflow-hidden flex flex-wrap`.
- **Columna texto** `flex-[1_1_400px] p-[clamp(28px,5vw,72px)] flex flex-col justify-center gap-[clamp(18px,2vw,26px)]`:
  - Píldora: `bg-white border border-[#F3E6CF] rounded-full pl-2 pr-3 py-1.5 text-[13px] font-semibold text-accent-800` con mini-badge "NUEVO" (`bg-accent text-ink text-[11px] font-extrabold tracking-[.04em] rounded-full px-2 py-0.5`) + "Llegaron vestidos y accesorios" (editable: idealmente desde CMS o constante).
  - H1 serif: "Moda para<br/>el <em>día a día.</em>" (em violeta cursiva).
  - Párrafo `max-w-[440px] text-neutral-600 leading-[1.6]`: "Ropa, accesorios y regalos seleccionados con cariño. Pides en minutos y lo coordinamos contigo por WhatsApp."
  - CTAs `flex flex-wrap gap-3`: **"Ver novedades →"** (primario `xl` con sombra, href `/shop`) y **"Encargos Shein · Temu · Amazon"** (blanco con borde `#E7DCC8`, href `/special-orders`).
- **Columna mosaico** `flex-[1_1_440px] min-h-[clamp(340px,42vw,600px)] grid grid-cols-[1.25fr_1fr] grid-rows-2 gap-2.5 p-2.5`:
  - Celda grande (row-span-2) `rounded-[22px]`: imagen de producto destacado + **tarjeta flotante** abajo (`inset-x-3 bottom-3 rounded-2xl bg-white/90 backdrop-blur p-2.5 pl-3`): nombre 13/700 truncado, precio 13px `#4B5563`, botón círculo negro 34px con arrow-up-right. Link a la ficha.
  - 2 celdas pequeñas con imágenes; una lleva badge de descuento si aplica.
  - **Datos**: usa los 3 primeros productos con `show_in_slider` (o `featured`) de la query existente `LandingRouteQuery` → no hace falta consulta nueva. Fallback: `bg-hero.jpg`.
- **Variante "Imagen completa"**: `bg-hero.jpg` full con degradado `linear-gradient(180deg, rgba(17,24,39,0) 30%, rgba(17,24,39,.72) 100%)`, texto blanco abajo-izquierda, em en `#FCD34D`, CTAs blanco/contorno blanco. **Siempre** con el degradado (hoy el texto va directo sobre la foto). Alt descriptivo (hoy `alt="Furniture"`).
- Debajo, **Perk strip** (ver componentes) `mt-3 md:mt-5`.
- En móvil, el mosaico baja debajo del texto (lo hace `flex-wrap` solo).

### A4. Compra por categoría (`ProductSubCollectionsCircles` → renombrar `CategoryRail`)
- Heading "Compra por categoría" + "Ver todo →" (`/shop`).
- Rail `grid grid-flow-col auto-cols-[minmax(132px,1fr)] gap-2.5 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory` con sangrado (`-mx-4 px-4`) para que asome la siguiente.
- Tarjeta: imagen `aspect-square rounded-[20px] bg-[#F4F2F8]` (`collection.featuredImage`) + label 14/700 centrado; hover texto violeta. Reemplaza los círculos de 180/240px.

### A5. "Te encantarán" (rejilla única con pestañas) — `id="productos"`
- Heading "Te encantarán" + "Piezas casuales y urbanas, con existencias limitadas."; a la derecha segmented: **Todo · Novedades · Ofertas · Más vendidos**.
- Filtros: Novedades = `badge === "new_product"` u ordenados por `created_at`; Ofertas = `discount > 0`; Más vendidos = `badge === "best_sale"` (o métrica de ventas si se añade). Máx 8 productos. Se puede hacer en cliente sobre la unión de `products` + `sliderProducts` ya consultados (deduplicar por id).
- Grid de ProductCard (ver componentes). Debajo, centrado, "Ver toda la tienda" (outline `lg`, `/shop`).
- **Se elimina la segunda rejilla "Productos Destacados"** (duplicaba productos).

### A6. Banners editoriales (`BannerCollectionCard`)
- `grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-3 md:gap-5` con los 2 banners lado a lado (en móvil apilados).
- Cada banner: link `relative flex items-end min-h-[clamp(380px,38vw,520px)] rounded-[28px] overflow-hidden`, imagen `fill object-cover`, degradado `180deg, transparent 35% → rgba(17,24,39,.75)`. Contenido `p-[clamp(22px,3vw,36px)] max-w-[460px] flex flex-col gap-3 text-white`: eyebrow `text-accent-300` · título serif · texto 15px · botón blanco píldora 46px texto ink.
- Copy: 1) eyebrow "Armario cápsula", "Esenciales.", "Prendas versátiles que combinan entre sí sin esfuerzo. Vístete con elegancia en minutos.", CTA "Explorar ropa" → `/collections/womens-clothing`, imagen `banner-cupboard.jpg`. 2) "Colección playa", "Verano.", "Diseños atemporales y cortes que realzan tu belleza natural, hechos para durar.", "Ver ropa de playa" → `/collections/swimwear`, `banner-swimwear.jpg`.

### A7. Encargos — `id="encargos"` (reemplaza `DifferentFeatureCards`)
- `rounded-[28px] bg-[#2E1065] text-white p-[clamp(28px,5vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[clamp(28px,4vw,56px)] items-center`.
- Izquierda: eyebrow "COMPRAS POR ENCARGO" `text-accent-300`; H2 serif "¿Lo viste en Shein, Temu o Amazon? <em text-primary-300>Te lo traemos.</em>"; botón **ámbar** `xl` con icono WhatsApp "Enviar link por WhatsApp" → `https://wa.me/${siteConfig.whatsappPhone}` con texto prellenado.
- Derecha: lista ordenada de 3 pasos, cada uno `rounded-[18px] bg-white/[.07] border border-white/[.12] px-5 py-[18px] flex gap-4`; número en círculo blanco 34px texto `#2E1065`; título 16/700; texto 14px `#DDD6FE`. Pasos: "Nos mandas el link — Copia el enlace del producto y envíalo por WhatsApp." / "Te cotizamos rápido — Precio final y fecha estimada de llegada, sin sorpresas." / "Te lo llevamos — Entrega a domicilio o en un punto acordado."

### A8. Footer (`MainFooter.tsx`)
- `mt-[clamp(56px,7vw,104px)] bg-white border-t border-[#EEEAF6]` (antes `bg-primary-50`).
- Grid `grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-8 py-[clamp(36px,5vw,64px)]`: bloque marca (span 2, `max-w-[380px]`): logo + "Tu tienda online de ropa y accesorios. Envíos a domicilio en Santa Clara, Placetas, Encrucijada y Calabazar de Sagua." (más corto que el actual). Columnas: Categorías (raíz, como hoy) / Servicios (Encargos, Mis órdenes, Lista de deseos) / Información (Sobre nosotros, Zonas de envío, Contacto — solo si existen las rutas; si no, omitir). Título columna 13/800 uppercase tracking-[.06em]; links 14px `#4B5563` hover violeta.
- Barra inferior `border-t border-[#F1EEF7] py-[18px] text-[13px] text-neutral-500`: "© {año} Klau's Shop. Todos los derechos reservados." En móvil se mantiene el acordeón de categorías existente (`FooterCategoriesAccordion`) con el nuevo estilo.

### A9. Tab bar móvil (ver componentes) — en `(store)/layout.tsx`.

---

## B. Tienda · Ficha de producto — `design/Tienda Producto.dc.html` → `src/app/(store)/shop/[slug]/page.tsx`

Mantener: metadata, JSON-LD, ISR, query, `notFound` sin stock. Cambia el layout:
- Breadcrumb `text-[13px] font-semibold text-neutral-500 mb-3 md:mb-6`: Inicio / {colección} / {nombre}.
- Contenedor `flex flex-wrap gap-[clamp(24px,4vw,64px)] items-start`.
- **Galería** (`ProductImageShowcase.tsx`) `flex-[1_1_520px] min-w-0 flex gap-3` → desktop: columna de miniaturas a la izquierda (`flex-col`, 72×90, `rounded-xl`, borde 2px `#6D28D9` en la activa) + imagen principal `aspect-[4/5] rounded-3xl bg-[#F1EEF7]` con badges (insignia + descuento) arriba-izquierda. Móvil: imagen arriba, miniaturas en fila debajo (`flex-col-reverse`), idealmente swipe (`carousel.tsx`) con puntos.
- **Info** `flex-[1_1_380px] max-w-[540px] flex flex-col gap-[22px] md:sticky md:top-24`:
  1. Fila: categoría (eyebrow 12/700 uppercase `#6B7280`, link) ↔ botones circulares 42px con borde `#E5E7EB`: compartir (share-2, `ShareProductButton`) y favorito (`AddToWishListButton`).
  2. H1 `text-[clamp(26px,3vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-pretty`.
  3. Precio `text-[clamp(26px,2.6vw,32px)] font-extrabold` + anterior `text-[17px] line-through text-neutral-500` + "Ahorras 263 CUP" `text-sm font-bold text-accent-700`. (Antes precio rojo + badge rojo.)
  4. Stock (`ProductStockDisplay`): punto 8px + "Última unidad disponible" / "Quedan N unidades" (`#B45309`) / "En stock · listo para entregar" (`#047857`), 14/700.
  5. **Color** (`ColorPicker`): label "Color: <span>Negro</span>"; swatches 40px círculo con padding 3px y anillo 2px (`#111827` activo, `#E5E7EB` inactivo). Mostrar el nombre del color (ya existe util `colorName`).
  6. **Talla** (`SizeSelector`): label "Talla" + link "Guía de tallas" (opcional; omitir si no hay contenido). Botones `min-w-14 h-12 px-4 rounded-xl border-[1.5px] text-[15px] font-bold`; activo `bg-ink text-white border-ink`; inactivo `bg-white border-[#D1D5DB]`; agotado tachado `opacity-40 line-through`.
  7. **Material** (`MaterialSelector`): mismo estilo que talla.
  8. Fila compra: cantidad (`QuantityInput`) píldora `h-[54px] border border-[#D1D5DB]` con − / n / + (botones 48px, + deshabilitado gris al llegar al stock) + **"Añadir al carrito"** primario `xl` flex-1 (min 200px) con icono shopping-bag.
  9. **"Preguntar por WhatsApp"** `outlineDark` 52px full width (link wa.me con nombre del producto y URL).
  10. Dos mini-cajas `grid-cols-2 gap-2.5`: "Envío a domicilio · Costo según tu zona" (`bg-primary-50`, icono truck violeta) y "Cambios al recibir · Si no te sirve, lo devuelves" (`bg-[#FFF8EE]`, icono repeat `#B45309`). `rounded-2xl p-3.5 text-[13px]`.
  11. Acordeón (`accordion.tsx`): "Descripción" (HTML existente) y "Envío y devoluciones" (texto existente). Trigger `h-14 text-[15px] font-extrabold`, signo +/− `#6B7280`, separadores `#ECEAF3`, contenido `text-[15px] leading-[1.65] text-neutral-600`. Primer ítem abierto por defecto.
- **"Te puede interesar"**: H2 sección + grid de ProductCard (misma rejilla). `pt-[clamp(56px,7vw,96px)]`.
- **Móvil**: barra fija inferior `bg-white/95 backdrop-blur border-t px-4 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] flex gap-3`: precio 17/800 + stock 12/600 en columna, y botón "Añadir al carrito" `h-[50px] flex-1` primario. Header móvil de la ficha: botón volver (chevron-left) en lugar de hamburguesa. Sin tab bar en esta página.
- Al añadir: abrir el **CartSheet** con notice de éxito (siguiente sección) + toast opcional.

## C. Carrito (drawer) — dentro de `Tienda Producto.dc.html` → `CartSheet.tsx`
- Overlay `bg-ink/40`; panel derecho `w-full max-w-[440px] bg-white flex flex-col` con sombra de drawer.
- Header `px-5 py-[18px] border-b border-[#F1EEF7]`: "Tu carrito (3)" 18/800 (contador `#6B7280` 600) + cerrar círculo 44px `bg-[#F4F2F8]` icono x.
- Notice tras añadir (opcional): "Producto añadido. Tu stock está reservado al pedir." (verifica que el copy sea cierto: el stock se reserva al crear la orden, no al añadir).
- Lista (`CartItemCard`) `py-3.5 border-b gap-3.5`: imagen 76×96 `rounded-xl`; nombre 14/700; variante 13px gris "Vestidos · Talla M · Negro"; abajo cantidad píldora 36px (34px por botón) y total de línea 15/800 tabular.
- **Zona de entrega** (`ShippingZoneSelect`): título 14/700 + grid 2 columnas de botones `min-h-11 rounded-xl border-[1.5px]` (activo `border-primary bg-primary-50`). Usa las zonas reales de `useShippingZones`. Si la zona tiene costo, mostrarlo en el botón (segunda línea 12px gris).
- Pie `bg-[#FAFAFC] border-t px-5 py-4 pb-[safe-area]`: Subtotal / Envío ("Se acuerda por WhatsApp" en `#B45309` si es null, o el costo de la zona) / **Total 18/800**; botón primario `xl` con icono WhatsApp "Hacer pedido por WhatsApp" (`WhatsAppCheckoutButton`, conserva su lógica y validaciones de `CustomerInfoForm`); nota 12px centrada "El pago se coordina por WhatsApp, fuera de la tienda."
- Vacío (`EmptyCart`): "Tu carrito está vacío." + botón "Ver novedades".
- `/cart` (página completa): misma estética en 2 columnas (lista izquierda, resumen derecho sticky), una columna en móvil con resumen fijo abajo.

---

## D. Admin · Shell (aplica a todas las páginas admin)
`src/app/(admin)/admin/layout.tsx`:
```
<div className="min-h-screen flex bg-[#F6F5FA]">
  <AdminSidebar className="hidden lg:flex" />        // sticky h-screen
  <div className="flex-1 min-w-0 flex flex-col pb-[76px] lg:pb-0">
    <AdminTopbar />
    <main className="w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-5 lg:py-8 flex flex-col gap-4 lg:gap-6">{children}</main>
  </div>
  <AdminTabBar className="lg:hidden" />
</div>
```
Quita `container`, `pt-[50px]` duplicados, `bg-white`, y el `MainNavbar` del admin. Mantén las comprobaciones de auth/admin tal cual.

## E. Admin · Dashboard — `design/Admin Dashboard.dc.html` → `admin/dashboard/page.tsx`
Conserva todas las queries Drizzle existentes; se añaden 3 lecturas baratas (marcadas ➕).
1. **Encabezado**: fecha larga 14/600 gris ("Martes, 20 de octubre", `date-fns` locale `es`) + H1 "Hola, {nombre}" (nombre del perfil admin; fallback "Dashboard"). A la derecha: segmented de rango **Hoy · 7 días · Este mes · 90 días** (escribe `?from&to` como hace hoy `CalendarDateRangePicker`; deja el picker personalizado como 5ª opción "Personalizado" que abre el calendario) + botón "Exportar" (outline admin, icono download, mismo `exportHref`).
2. **"Requiere tu atención"** (tarjeta blanca p-[18px]): título 15/800 con punto ámbar + link "Ver órdenes →". Grid `auto-fit minmax(210px,1fr) gap-2.5` de 4 AttentionCards:
   - Órdenes por confirmar ➕ (`count where order_status='pending_confirmation'`) → `/admin/orders?status=pending_confirmation`
   - Esperando pago ➕ (`pending_payment`) → `/admin/orders?status=pending_payment`
   - Productos sin stock (ya existe `outOfStockCount`) → `/admin/products?stock=out`
   - Envío sin costo definido ➕ (`shipping_cost IS NULL and status in pending_*`) → `/admin/orders?shipping=pending`
   (Hoy existe `pendingOrdersRow` que suma ambos pendientes: sepáralo.)
3. **KPIs** grid `auto-fit minmax(230px,1fr) gap-3 lg:gap-4` de 4 StatCards: **Ingresos pagados** (`revenueCurrent`), **Ventas pagadas** (`salesCurrent`), **Ticket promedio** (revenue/sales; delta vs. anterior), **Ingresos por envíos** (`shippingRevenueCurrent`). Sparkline = `overviewData` del período (reutiliza). Se quitan "Productos" y "Usuarios registrados" de los KPIs (Productos pasa al bloque de inventario; usuarios a la página de usuarios). Labels cortos sin "(pagados) - mes".
4. **Fila gráfico + estados** grid `lg:grid-cols-3 gap-4` (gráfico `lg:col-span-2`; en < lg una columna — corrige el bug actual de `col-span-4/3` en `md:grid-cols-2`):
   - **Ingresos pagados** (`Overview.tsx`, recharts): barras redondeadas `radius={[5,5,2,2]}`, color `#DDD6FE`, barra máxima `#7C3AED`, barra en hover `#6D28D9`; grid horizontal punteado `#ECEAF3`; ejes 11px `#9CA3AF` sin línea; Y en "k". Alto `clamp(180px,22vw,260px)`. A la derecha del título, lectura del valor: por defecto "Mejor día · 18.400 CUP"; en hover la barra (día · monto). Subtítulo "{rango} · {total} CUP en total". Tooltip nativo de recharts deshabilitado o con este estilo.
   - **Estado de las órdenes** ➕ (`count(*) group by order_status` en el período): barra apilada 10px `rounded-full gap-0.5` con los colores-punto de cada estado + lista (cuadrado 10px, label 14/600, número 14/800 tabular, separadores `#F3F2F7`), cada fila linkea a la tabla filtrada. Subtítulo "{n} órdenes activas en el período".
5. **Fila órdenes + inventario** misma grid:
   - **Órdenes recientes** (col-span-2): header con chips Todas / Pendientes / En curso. Desktop tabla: Orden (KS-#### 800 + "Hace 12 min" 12px gris) · Cliente (nombre 600 + "zona · N artículos") · Estado (StatusPill) · Total (derecha, 800) · Acción (botón siguiente transición: primario para pendientes, `soft` para el resto, usa `ORDER_STATUS_ACTIONS` con labels cortos: Confirmar / Marcar pagada / Preparar / Marcar enviada / Entregada; ejecuta `OrderQuickActions` y respeta `SHIPPING_REQUIRED_MESSAGE`). Móvil: tarjetas (ver Órdenes). Reemplaza `RecentSales` (que solo mostraba pagadas). Últimas 7.
   - **Inventario** (col-span-1): título + "Productos →"; 5 filas: miniatura 44px `rounded-[10px]`, nombre 14/600 truncado, colección 12px, pill de stock ("Agotado" red-50/red-700; "1 und." / "3 und." orange-50/orange-700). Primero agotados (query existente) y luego stock < 5 ➕. Separador y "Más vendidos del período" ➕ (`sum(order_lines.quantity) group by product` en órdenes pagadas del rango, top 3): nombre 13/600, barra 72×6 `bg-[#F1EEF7]` con relleno violeta proporcional, número 13/800.

## F. Admin · Órdenes (tabla) — `design/Admin Ordenes.dc.html` → `admin/orders/page.tsx`, `OrdersColumns.tsx`, `OrdersDataTable.tsx`
1. Encabezado: H1 "Órdenes" + "Pedidos recibidos por la tienda y confirmados por WhatsApp." · acciones: "Exportar" (outline admin) y "Nueva orden" (primario admin con +, → `/admin/orders/new`).
2. Tarjeta blanca `rounded-[18px] overflow-hidden` con:
   - **Tabs por estado con contador**: Todas · Pendientes (confirmación + pago) · Pagadas · En preparación · Enviadas · Entregadas · Canceladas. Estado en URL (`?status=`), contadores con un `group by`.
   - **Toolbar** `p-3 flex flex-wrap gap-2`: buscador (número, cliente o teléfono — ya existe búsqueda en `data-table-toolbar`) + chips de zona (Todas + zonas reales).
   - **Barra de selección** (cuando hay filas marcadas) `mx-3 mb-3 rounded-xl bg-ink text-white px-3.5 py-2.5`: "{n} seleccionadas" · "Marcar como enviadas" (botón blanco) · "Exportar" (contorno blanco/30) · "Cancelar" (texto `#C4B5FD`). Las acciones masivas solo aplican transiciones válidas (`isValidStatusTransition`); informar cuántas se saltaron. Si es demasiado trabajo, deja solo Exportar.
   - **Tabla desktop** (≥ lg): header `bg-[#FAFAFC] text-xs uppercase tracking-[.05em] text-neutral-500 font-bold`, celdas `px-3 py-3`, filas `border-t border-[#F1EFF6] hover:bg-[#FAF9FD]`, seleccionadas `bg-primary-50`. Columnas: ☐ · **Número** (link 800) · **Cliente** (nombre 600 + "teléfono · zona" 12px) · **Fecha** (`dd/MM HH:mm`, America/Havana, tabular) · **Estado** (StatusPill + pill "⏱ Hace N días" si >48 h) · **Pago** (texto 13/700: Pagado verde / No pagado rojo / Reembolsado gris) · **Total** (derecha 800 + "Envío por acordar" 11/700 `#B45309` si `shipping_cost` null) · **Acción** (botón siguiente transición `sm` + chevron 32px a detalle; el menú `…` con eliminar se mueve al detalle). Cabeceras ordenables con flecha ↑/↓ (`DataTableColumnHeader`).
   - **Móvil**: cada fila es un link-tarjeta `px-4 py-3.5 border-t`: "KS-1058 · Daniela Pérez" 15/800 + total a la derecha; "fecha · zona" 12px; fila de StatusPill + pill antigüedad + pago a la derecha. Sin checkbox ni acción inline (se actúa en el detalle).
   - Vacío: "No hay órdenes con estos filtros."
   - **Paginación** `px-4 py-3 border-t text-[13px]`: "Mostrando N de T órdenes" + botones 34px (activo `bg-ink text-white`).

## G. Admin · Detalle de orden + formulario — `design/Admin Orden Detalle.dc.html` → `admin/orders/[orderId]/page.tsx`
1. Topbar con volver + breadcrumb. Encabezado: H1 "Orden KS-1058" + StatusPill (tamaño 13px) + fecha larga "20 de octubre de 2026 · 10:42".
2. **Stepper** (`OrderProgress.tsx`, reutilizable en la tienda) tarjeta `px-[18px] py-4 overflow-x-auto` (min-w 640px): 6 pasos del flujo; círculo 30px — completado `bg-primary text-white` "✓", actual `bg-white text-primary border-2 border-primary` número, futuro `bg-[#F3F2F7] text-neutral-400`; label 13/700; conector 2px (`#6D28D9` completado, `#ECEAF3` pendiente). Cancelada: todos grises + pill roja.
3. **Dos columnas** `flex flex-wrap gap-[18px]`: principal `flex-[2_1_520px]`, lateral `flex-[1_1_320px]`. **En móvil el lateral va primero** (`flex-col-reverse`, como ya hace el código actual con `order-first`).
   - **Productos**: header "Productos (2)" + "Stock reservado" (12/700 gris; "Stock descontado" tras pagar). Filas: imagen 60×72 `rounded-xl`, nombre 14/700 link al producto, chips de atributos `rounded-md bg-[#F3F2F7] px-2 py-0.5 text-xs font-semibold` (Talla M · Cant. 1 · -10% · color con swatch); a la derecha total de línea 14/800 + "5.000 c/u" 12px (`OrderLinePrice`). Totales en `bg-[#FAFAFC] px-5 py-4`: Subtotal · "Envío · {zona}" ("Por acordar" ámbar-700 / "Gratis" / monto) · **Total 18/800** ("9.500 CUP + envío" si es null).
   - **Formulario Costo de envío** (`ShippingCostEditor`), solo editable en `pending_*`; borde `#FED7AA` si falta: icono truck en caja `bg-primary-50` + título "Costo de envío" + "Usa 0 si es gratis. Así el cliente recibe el total correcto. No se puede cambiar una vez pagada." · chips de montos rápidos (Gratis / costos de las zonas de envío reales) · input "Monto (CUP)" 46px `inputMode="numeric"` 16px/700 tabular + botón `dark` 46px "Guardar envío". Validación: vacío → "Escribe un monto (0 si es gratis)."; pagada → "La orden ya está pagada: el envío es definitivo." (la API ya lo rechaza).
   - **Siguiente paso** (`OrderStatusChanger`, lateral): título; descripción de la acción (`ORDER_STATUS_ACTIONS[next].description`); aviso naranja si falta envío ("Primero define el costo de envío (usa 0 si es gratis)."); botón primario 50px full con `ORDER_STATUS_ACTIONS[next].label` (deshabilitado `bg-primary-300` si falta envío); "Cancelar orden · libera el stock" `destructiveSoft` 44px (con `AlertDialog` de confirmación) cuando `cancelled` es transición válida; estados finales: "Estado final: no admite más cambios."
   - **Cliente**: avatar iniciales 44px `bg-primary-100 text-primary-700` + nombre 15/800 + "Cliente registrada · N pedidos" (o "Invitado"); botón "Escribir por WhatsApp" 46px `bg-emerald-50 text-emerald-700` (usa `getWhatsAppUrl`); `dl` 2 columnas (Teléfono, Zona, Dirección, Email) 14px, labels `#6B7280` 600; nota del cliente en caja `bg-[#FFF8EE] rounded-xl` "Nota del cliente".
   - **Pago**: Método (`getPaymentMethodLabel`) y Estado (`getPaymentStatusInfo`) en filas justify-between.
   - **Eliminar orden**: botón texto rojo 13/800 con trash-2, hover `bg-red-50`, al final del lateral (en móvil queda al final de todo) → `DeleteOrderDialog`.

---

## Estados responsive a verificar (todas)
390 · 768 · 1024 · 1280 · 1440. Sin scroll horizontal de página. Tab bars no tapan contenido (padding inferior). Headers sticky no tapan anclas (`scroll-margin-top: 120px` en secciones con id).
