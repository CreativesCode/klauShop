# 05 · Auditoría (estado actual → solución)

Severidad: **Crítico** (bloquea uso) · **Alto** (daña conversión/usabilidad) · **Medio** · **Bajo**.

## Notas generales
| Área | Nota | Resumen |
|---|---|---|
| Marca y color | A | Logo y paleta violeta/ámbar con personalidad. Se conservan. |
| Tipografía | C | Sora en todo; jerarquía irregular; 10px en móvil. |
| Consistencia visual | C | 3 radios de botón distintos; insignias todas rojas. |
| Tienda en móvil | B- | Funciona, pero hero alto, header apretado y tarjetas saturadas. |
| Admin en móvil | D | Sin navegación: el sidebar se oculta y no hay reemplazo. |
| Dashboard | C | Datos reales, pero pasivo: no prioriza qué hacer. |

## Tienda
1. **Alto** — Hero: texto blanco directamente sobre la foto sin capa de contraste; alturas fijas 500/600/800px; h1 hasta `text-9xl`; un solo CTA contorno; `alt="Furniture"`. → Hero mosaico sobre crema (o foto con degradado), altura por contenido con `clamp()`, dos CTAs. *`(store)/page.tsx · HeroSection`*
2. **Alto** — Insignias Nuevo/Destacado/Mejor venta y descuento todas rojas (`#ff0000`/`bg-destructive`): no se distinguen y compiten con el precio. → Neutras/violeta; ámbar solo descuento. *`ui/badge.tsx`*
3. **Alto** — ProductCard satura (categoría, nombre, 2 precios, stock, hasta 6 puntos de color, 6 chips de talla) con textos de 10px; corazón de 28px en móvil. → Máx. 5 datos, mín. 12px, imagen 4:5, botón añadir, favorito 40px. *`ProductCard.tsx`*
4. **Medio** — "Te encantarán" y "Productos Destacados" son dos rejillas iguales que repiten productos. → Una rejilla con pestañas. *`(store)/page.tsx`*
5. **Medio** — Tarjetas de beneficios genéricas, centradas, íconos ámbar sobre blanco (2.1:1). → Perk strip compacto + bloque Encargos (diferenciador real). *`DifferentFeatureCards`*
6. **Medio** — Categorías en círculos fijos 180/240px; en móvil no se nota que hay scroll. → Tarjetas cuadradas con scroll-snap que asoman la siguiente. *`ProductSubCollectionsCircles`*
7. **Medio** — Radios de botón mezclados: `rounded` (hero), `rounded-full` (banners), `rounded-md` (default). `outline` hace hover ámbar. → Tienda píldora, admin 10px. *`ui/button.tsx`*
8. **Medio** — Precios "5225.00 CUP": decimales innecesarios, sin separador. Precio con descuento en rojo. → `formatCUP` "5.225 CUP", tabular, precio en tinta. *`lib/utils.ts`*
9. **Medio** — Header móvil: hamburguesa + icono búsqueda + logo + usuario + carrito en una fila; búsqueda escondida. Navbar `fixed` con paddings mágicos (`pt-[50px] md:pt-[114px]`). → 2 filas (logo centrado / buscador visible), sticky, tab bar inferior. *`MobileNavbar.tsx`, `(store)/layout.tsx`*
10. **Medio** — Ficha: precio y descuento en rojo, `text-4xl` fijo, "Envío y devoluciones" enterrado, sin barra de compra fija en móvil. → §B de pantallas. *`shop/[slug]/page.tsx`*
11. **Bajo** — Restos de la plantilla Hiyori: título por defecto "Ecommerce Platform Built with Nextjs 14.", `siteConfig.url/address/phone/email` falsos, `mainNav` en inglés, `ShipReturns.tsx` con texto en inglés de otra tienda, placeholder de imagen de `hiyori-backpack` en `keytoUrl`. → Reemplazar/eliminar (SEO y confianza). *`config/site.ts`, `ShipReturns.tsx`, `lib/utils.ts`*
12. **Bajo** — Scrollbar global de 2px (difícil de usar en desktop). → Quitar. *`globals.css`*
13. **Bajo** — Botones de icono sin `aria-label` en el propio control (está en el svg). → `aria-label` en `<a>/<button>`.

## Admin
1. **Crítico** — En < md el `aside` tiene `hidden` y no hay otro menú: en el móvil no se puede navegar entre secciones. → `AdminTabBar` (5 pestañas + "Más"). *`(admin)/admin/layout.tsx`*
2. **Alto** — Gráfico y ventas usan `col-span-4`/`col-span-3` dentro de `md:grid-cols-2`: entre 768–1024px se crean columnas implícitas y desborda. → `lg:grid-cols-3` + `lg:col-span-2`. *`dashboard/page.tsx`*
3. **Alto** — El flujo real es por WhatsApp (confirmar → pago → preparar → enviar) pero el dashboard solo muestra un contador de pendientes; "Ventas recientes" solo muestra pagadas. → "Requiere tu atención" + órdenes recientes con la siguiente acción en un clic. *`orderStatus.tsx`, `RecentSales.tsx`*
4. **Medio** — 5 KPIs en `lg:grid-cols-5` con títulos largos ("Ingresos por envíos (pagados) - mes") aunque el rango no sea un mes. → 4 KPIs con etiqueta corta, delta y sparkline. *`dashboard/page.tsx`*
5. **Medio** — El admin reutiliza la barra de la tienda y duplica `pt-[50px]`; `aside` con `top-14` que no coincide con la altura real. → Shell propio. *`AdminShell.tsx`, layouts*
6. **Medio** — Ítem activo del sidebar por igualdad estricta: en `/admin/orders/123` no se marca "Órdenes". Sin grupos ni contadores. → Prefijo, grupos, contador. *`SidebarNav.tsx`*
7. **Medio** — Tabla de órdenes: estado y pago como `Badge outline` con bordes de colores (ruido), acciones escondidas en menú `…`. → StatusPill sin borde + botón de siguiente acción visible + tabs por estado. *`OrdersColumns.tsx`*
8. **Bajo** — `moneyUSD()` formatea CUP con `toLocaleString(undefined)`; SVGs de iconos pegados a mano en cada KPI. → `formatCUP` e `Icons`. *`dashboard/page.tsx`*
