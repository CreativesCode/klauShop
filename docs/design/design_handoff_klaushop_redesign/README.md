# Handoff: Rediseño Klau's Shop 2.0 (tienda + admin)

> Paquete para Claude Code. Léelo completo antes de tocar código. Todo está en español porque el producto y el equipo son hispanohablantes; los nombres de archivos/código del repo se mantienen tal cual.

## 1. Overview

Klau's Shop (`klauShop/`, Next.js 14 App Router + Tailwind + shadcn/ui + Supabase/Drizzle + urql GraphQL) es una tienda de ropa y accesorios en Villa Clara (Cuba). El checkout NO es una pasarela: el cliente crea la orden en la tienda (se reserva stock) y se confirma/paga por WhatsApp. El admin gestiona órdenes siguiendo el flujo `pending_confirmation → pending_payment → paid → processing → shipped → delivered` (+ `cancelled`).

Este rediseño:
- **Conserva** logo (`public/imagotipo_horizontal.svg`, `public/isotipo.svg`) y paleta (violeta `#6D28D9` / ámbar `#F59E0B`).
- **Cambia** tipografía (Sora → Manrope + Instrument Serif), radios, insignias, tarjetas, hero, layout del home, ficha de producto, carrito (CartSheet), shell del admin, dashboard, tabla de órdenes y detalle de orden.
- **Corrige** problemas de usabilidad y responsive detectados en la auditoría (`docs/05-AUDITORIA.md`), el más grave: **el admin no tiene navegación en móvil**.
- Define **tokens + componentes base** para que el resto de pantallas (colecciones, búsqueda, wishlist, órdenes del cliente, settings, auth, productos/colecciones/medios/usuarios/envíos del admin) hereden el nuevo estilo con cambios mínimos.

## 2. About the design files

Los archivos de `design/` son **referencias de diseño hechas en HTML** (prototipos que muestran aspecto y comportamiento), **no código de producción para copiar**. Están escritos con estilos inline y un runtime propio (`support.js`) solo para poder previsualizarlos. La tarea es **recrearlos dentro de `klauShop/`** usando sus patrones existentes: Server Components, Tailwind, `cn()`, `cva`, componentes shadcn de `src/components/ui`, íconos de `lucide-react` vía `src/components/layouts/icons.tsx`, `next/image`, `next/font`.

Para verlos: abre cualquier `design/*.dc.html` en un navegador (necesitan estar junto a `support.js` y `assets/`). `Vista Responsive.dc.html` muestra cada pantalla en 1440px y 390px lado a lado. `Guia de Diseno.dc.html` es la guía visual (auditoría + tokens + componentes).

Los datos de los mocks (clientes, teléfonos, montos, costos de envío 300/500/600) son **de ejemplo**. Los productos, imágenes (Supabase storage) y textos de envío/devoluciones son reales del sitio. Los estados de orden, transiciones y textos de acciones salen de `src/features/orders/utils/orderStatus.tsx` — **siguen siendo la fuente de verdad**.

## 3. Fidelity

**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados, radios y estados son finales. Recréalo lo más fiel posible con Tailwind. Cuando un valor no exista en la escala de Tailwind, usa valores arbitrarios (`rounded-[18px]`) o añádelo al config (ver `docs/01-TOKENS.md`). La lógica de negocio NO cambia: solo presentación y estructura de UI (más algún dato nuevo de lectura en el dashboard).

## 4. Cómo trabajar este paquete (orden obligatorio)

1. Lee `docs/05-AUDITORIA.md` (qué está mal y por qué) y `docs/01-TOKENS.md`.
2. Sigue `docs/04-PLAN.md` fase por fase. Cada fase es un PR/commit independiente y deja el sitio funcionando.
   - Fase 0: fuentes + tokens (afecta todo el sitio sin romper nada).
   - Fase 1: componentes base (`button`, `badge`, `input`, `card`, `formatCUP`, `ProductCard`).
   - Fase 2: shells (navbar/footer/tab bar de tienda; layout/sidebar/topbar/tab bar del admin).
   - Fase 3: pantallas clave (home, ficha de producto, CartSheet, dashboard, órdenes, detalle de orden).
   - Fase 4: propagar a pantallas secundarias usando las reglas de `docs/02-COMPONENTS.md`.
3. Para cada pantalla de la Fase 3 usa `docs/03-SCREENS.md` (layout, medidas, copy, responsive, archivo destino).
4. Tras cada fase: `npm run lint`, `npm test`, revisa en 390px, 768px, 1024px, 1440px.

## 5. Reglas de oro (no negociables)

1. **Un solo primario por bloque**: botón violeta `#6D28D9`. Acción secundaria fuerte = negro `#111827`. Ámbar solo para descuentos, contadores y CTA de WhatsApp/encargos (siempre con texto `#111827`).
2. **El ámbar nunca es color de texto sobre blanco** (contraste 2.1:1). Texto "pocas unidades" = `#B45309`.
3. **Tienda: botones píldora (`rounded-full`) de 48–54px. Admin: `rounded-[10px]`/`rounded-xl` de 40–46px.** No mezclar.
4. **Texto mínimo 12px** en cualquier viewport. Inputs a **16px en móvil** (evita zoom de iOS).
5. **Objetivos táctiles ≥ 44px** en móvil (corazón de favorito 40px es la única excepción tolerada, dentro de la imagen).
6. **Precios sin decimales y con punto de miles**: `4.500 CUP` (helper `formatCUP`). `font-variant-numeric: tabular-nums` (`tabular-nums`) en precios y métricas. ⚠️ Los mensajes de WhatsApp usan `formatPrice` — ver nota en el plan.
7. **Dos layouts**: móvil (< 820px tienda / < 900px admin ≈ `md`/`lg` de Tailwind, ver tokens) y escritorio. Lo intermedio se resuelve con grids fluidos (`repeat(auto-fill, minmax(...))`) y `clamp()`, no con muchos breakpoints.
8. **Navegación principal abajo en móvil** (tienda: 4 pestañas; admin: 5 pestañas). En móvil las tablas del admin se convierten en tarjetas — nunca scroll horizontal de tabla.
9. **Bordes suaves en lugar de sombras** (`#ECEAF3`). Sombra solo en el CTA primario y en elementos flotantes (drawer, toast).
10. **Instrument Serif solo en títulos editoriales de la tienda (≥ 32px)**. Nunca en el admin.
11. No inventar UI nueva que no esté en los mocks o en estas guías. Si algo no está definido, aplicar el componente base más cercano.

## 6. Archivos del paquete

```
design_handoff_klaushop_redesign/
├── README.md                ← este archivo
├── PROMPT-CLAUDE-CODE.md    ← prompt listo para pegar en Claude Code
├── docs/
│   ├── 01-TOKENS.md         ← colores, tipografía, espaciado, radios, sombras, motion + código de config
│   ├── 02-COMPONENTS.md     ← especificación de cada componente base y archivo destino
│   ├── 03-SCREENS.md        ← cada pantalla: layout, medidas, copy, estados, responsive
│   ├── 04-PLAN.md           ← plan por fases con checklist y criterios de aceptación
│   └── 05-AUDITORIA.md      ← hallazgos de la auditoría con severidad y archivo
├── snippets/                ← código de referencia listo para adaptar (no pegar a ciegas)
│   ├── layout.tsx
│   ├── tailwind.config.ts
│   ├── globals.css
│   ├── button.tsx
│   ├── badge.tsx
│   ├── format.ts
│   ├── StatusPill.tsx
│   ├── StatCard.tsx
│   ├── MobileTabBar.tsx
│   └── AdminTabBar.tsx
└── design/                  ← prototipos HTML (referencia visual/interactiva)
    ├── Guia de Diseno.dc.html
    ├── Vista Responsive.dc.html
    ├── Tienda Inicio.dc.html
    ├── Tienda Producto.dc.html     (incluye el carrito como drawer)
    ├── Admin Dashboard.dc.html
    ├── Admin Ordenes.dc.html
    ├── Admin Orden Detalle.dc.html
    ├── support.js
    └── assets/ (imagotipo_horizontal.svg, isotipo.svg — mismos del repo)
```

## 7. Mapa diseño → código

| Mock | Archivos del repo a modificar |
|---|---|
| Tienda Inicio | `src/app/(store)/page.tsx`, `src/components/layouts/MainNavbar.tsx`, `MobileNavbar.tsx`, `CategoriesSubNav*.tsx`, `SearchInput.tsx`, `MobileSearchInput.tsx`, `MainFooter.tsx`, `src/app/(store)/layout.tsx`, nuevo `src/components/layouts/MobileTabBar.tsx`, `src/features/products/components/ProductCard.tsx` |
| Tienda Producto | `src/app/(store)/shop/[slug]/page.tsx`, `ProductImageShowcase.tsx`, `ProductStockAndFormWrapper.tsx`, `ProductStockDisplay.tsx`, `SizeSelector.tsx`, `ColorPicker.tsx`, `MaterialSelector.tsx`, `AddProductToCartForm.tsx`, `ShareProductButton.tsx`, `AddToWishListButton.tsx`, `QuantityInput.tsx` |
| Carrito (drawer) | `src/features/carts/components/CartSheet.tsx`, `CartItemCard.tsx`, `CartSection.tsx`, `EmptyCart.tsx`, `WhatsAppCheckoutButton.tsx`, `ShippingZoneSelect.tsx`, `src/app/(store)/cart/page.tsx` (misma estética, página completa) |
| Admin (shell) | `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/layout.tsx`, `src/components/admin/SidebarNav.tsx`, `src/components/admin/AdminShell.tsx`, `src/config/dashboard.ts`, nuevo `src/components/admin/AdminTopbar.tsx`, nuevo `src/components/admin/AdminTabBar.tsx` |
| Admin Dashboard | `src/app/(admin)/admin/dashboard/page.tsx`, `src/features/cms/components/Overview.tsx`, `RecentSales.tsx`, `CalendarDateRangePicker.tsx`, nuevo `src/components/admin/StatCard.tsx` |
| Admin Órdenes | `src/app/(admin)/admin/orders/page.tsx`, `src/features/orders/components/admin/OrdersColumns.tsx`, `OrdersDataTable.tsx`, `OrderQuickActions.tsx`, `src/components/ui/data-table-*.tsx`, `src/features/cms/components/DataTable.tsx` |
| Admin Orden Detalle | `src/app/(admin)/admin/orders/[orderId]/page.tsx`, `OrderStatusChanger.tsx`, `ShippingCostEditor.tsx`, `DeleteOrderDialog.tsx`, `src/features/orders/components/OrderProgress.tsx` |

## 8. Assets

- Logo: `public/imagotipo_horizontal.svg` (viewBox 400×240 con mucho aire: en el header se recorta con un contenedor `overflow-hidden` de 44px de alto y la imagen a ~76px de alto con márgenes negativos; mejor alternativa: crear `public/imagotipo_horizontal_tight.svg` con viewBox recortado `70 30 300 170` aprox. y usarlo a 40px de alto). `public/isotipo.svg` para el admin.
- Íconos: **lucide** (ya instalado como `lucide-react`). Los mocks cargan `lucide-static@0.460.0`. Añade a `icons.tsx` los que falten: `ArrowRight`, `ArrowUpRight`, `ArrowLeft`, `Bell`, `BadgeCheck`, `CircleCheck`, `Clock`, `CreditCard`, `Download`, `House`, `LayoutGrid`, `MessageCircle`, `PackageSearch`, `PackageX`, `PanelLeftClose`, `PanelLeftOpen`, `Repeat`, `Share2`, `Store`, `Trash2`, `ChevronRight`. WhatsApp ya existe (`Icons.whatsapp`).
- Imágenes: todas vienen de Supabase storage (`keytoUrl(key)`), igual que hoy. Hero mosaico usa imágenes de productos destacados (ver `docs/03-SCREENS.md`); los banners siguen usando `banner-cupboard.jpg` y `banner-swimwear.jpg`; la variante "imagen completa" del hero usa `bg-hero.jpg`.
- Fuentes: Google Fonts vía `next/font/google`: `Manrope` (400–800) e `Instrument_Serif` (400, normal + italic).
