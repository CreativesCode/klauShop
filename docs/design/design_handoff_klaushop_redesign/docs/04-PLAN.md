# 04 · Plan de implementación

Cada fase = un commit/PR que deja el sitio funcionando. Marca las casillas al avanzar. No cambies lógica de negocio (pedidos, stock, RLS, WhatsApp) salvo donde se indica explícitamente.

## Fase 0 — Fundamentos (impacto global, riesgo bajo)
- [ ] `src/app/layout.tsx`: cambiar Sora por Manrope (`--font-sans`) + Instrument Serif (`--font-display`). Ver `snippets/layout.tsx`. Quitar `sora.className` del body (la familia la pone Tailwind).
- [ ] `tailwind.config.ts`: `fontFamily.sans/display`, colores nuevos (`ink`, `cream`, `line`, `surface`), `primary.950 = #2E1065`. Ver `snippets/tailwind.config.ts`.
- [ ] `globals.css`: `--background`, `--border`, `--input`, `--radius: 1.125rem`; eliminar scrollbar de 2px; añadir `.no-scrollbar`; `font-feature-settings`/`tabular-nums` utilitaria; `prefers-reduced-motion`. Ver `snippets/globals.css`.
- [ ] `src/config/site.ts`: reemplazar datos de plantilla (url `hiyori.hugo-coding.com`, address California, phone, email, `mainNav` en inglés con links a GitHub) por datos reales o eliminarlos si no se usan; `getPageTitle()` sin título → `"Klau's Shop | Ropa y accesorios en Villa Clara"`. **Pregunta al dueño** los datos reales si no están en el repo.
- [ ] `public/`: crear `imagotipo_horizontal_tight.svg` (mismo contenido con `viewBox` recortado al contenido) para usar el logo a 40px sin márgenes negativos. Comprueba visualmente.
- **Aceptación**: el sitio se ve igual de estructura pero con nueva fuente; no hay `var()` rotos; lint/test ok.

## Fase 1 — Componentes base
- [ ] `src/lib/utils.ts`: añadir `formatCUP(n)` → "4.500 CUP" (ver `snippets/format.ts`). ⚠️ `formatPrice` se usa también en los **mensajes de WhatsApp** (`features/orders/utils/whatsapp.ts`) y en exportaciones: **no cambies `formatPrice`**; usa `formatCUP` solo en UI. Busca `toFixed(2)} CUP` y `formatPrice(` en componentes visuales y reemplaza.
- [ ] `ui/button.tsx`: variantes y tamaños nuevos (`snippets/button.tsx`). Revisa usos de `buttonVariants({ variant: "outline" ... })` con clases extra (hero, banners) y límpialos.
- [ ] `ui/badge.tsx`: variantes nuevas (`snippets/badge.tsx`). Ajusta `BadgeType` en `lib/supabase/schema.ts` solo si es necesario (el enum de BD no cambia).
- [ ] Nuevo `features/orders/components/StatusPill.tsx` + `shortLabel` en `ORDER_STATUS_INFO` y `dot` (hex del punto). Sustituir los `Badge variant="outline"` de estado en `OrdersColumns.tsx`, `orders/[orderId]/page.tsx` (admin y tienda), `OrdersList.tsx`.
- [ ] `ui/input.tsx`: 46px, `rounded-xl`, `text-base md:text-sm`, foco violeta + ring-4.
- [ ] `ui/card.tsx`: sin sombra, `rounded-[18px] border-[#ECEAF3]`, `CardTitle` 15/800 por defecto (revisa las páginas que dependan del tamaño grande y pásales `className` si hace falta).
- [ ] `features/products/components/ProductCard.tsx` + `ProductCardSkeleton.tsx` según `02-COMPONENTS.md`.
- [ ] Iconos faltantes en `components/layouts/icons.tsx` (lista en README §8).
- **Aceptación**: catálogo, colecciones, búsqueda y wishlist ya muestran las nuevas tarjetas en 2/3/4 columnas; ningún texto < 12px (`grep -r "text-\[10px\]" src` vacío).

## Fase 2 — Shells
Tienda:
- [ ] `(store)/layout.tsx`: barra de anuncio + navbar sticky (quitar `pt-[50px] md:pt-[114px]`) + `MobileTabBar` + `pb-[72px] md:pb-0`.
- [ ] `MainNavbar.tsx` / `MobileNavbar.tsx` / `CategoriesSubNav*.tsx` / `SearchInput.tsx` / `MobileSearchInput.tsx` según `03-SCREENS.md §A2`. Mantener `UserNav`, `CartNav`, `SideMenu` (en móvil).
- [ ] `MainFooter.tsx` según §A8.
- [ ] Nuevo `components/layouts/MobileTabBar.tsx` (`snippets/MobileTabBar.tsx`), oculto en `/cart` y `/shop/[slug]`.
Admin:
- [ ] `(admin)/admin/layout.tsx` y `(admin)/layout.tsx` según §D. Quitar `MainNavbar adminLayout` del admin.
- [ ] `config/dashboard.ts`: agrupar ítems (General / Catálogo / Clientes y envíos), renombrar "Envíos" → "Zonas de envío".
- [ ] `SidebarNav.tsx` (grupos, activo por prefijo, contador, colapsable) + nuevo `AdminTopbar.tsx` + nuevo `AdminTabBar.tsx` (`snippets/AdminTabBar.tsx`) con hoja "Más".
- [ ] `AdminShell.tsx`: encabezado H1 `text-[clamp(24px,2.4vw,32px)] font-extrabold tracking-[-0.02em]` + descripción 14px gris + slot `actions` a la derecha; sin `border-b`.
- **Aceptación**: en 390px se puede navegar por todo el admin con la barra inferior; en ≥1024 sidebar sticky; ninguna página admin tiene scroll horizontal.

## Fase 3 — Pantallas clave
- [ ] Inicio (§A3–A7). Eliminar la rejilla duplicada "Productos Destacados" y `DifferentFeatureCards`.
- [ ] Ficha de producto (§B) incluida la barra fija móvil.
- [ ] CartSheet + `/cart` (§C).
- [ ] Dashboard (§E) con las 3 queries nuevas (contadores separados de pendientes y envío sin costo, conteo por estado, top productos). Mantén `export const metadata` y el endpoint de exportación.
- [ ] Órdenes (§F) con tabs por estado en URL.
- [ ] Detalle de orden (§G) incluido el stepper (`OrderProgress.tsx`) y el formulario de envío.
- **Aceptación**: comparar lado a lado con `design/Vista Responsive.dc.html` en 1440 y 390; flujo completo de una orden (confirmar sin envío → aviso; definir envío → confirmar → pagar → preparar → enviar → entregar) funciona igual que antes.

## Fase 4 — Propagación
Aplicar las reglas de `02-COMPONENTS.md §Reglas para pantallas no diseñadas` a:
- [ ] Tienda: `collections/[collectionSlug]`, `shop` (búsqueda + `FilterSheet`, `SortSelection`, `FilterBadges`), `wish-list`, `orders`, `orders/[orderId]`, `orders/confirmation`, `special-orders`, `about-us`, `setting/*`, `not-found.tsx`.
- [ ] Auth: `sign-in`, `sign-up`, `reset-password`, `error`.
- [ ] Admin: productos (lista + formulario `features/products/components/admin`), colecciones, multimedia (`ImageGrid`, `UploadMediaContainer`), usuarios, zonas de envío, nueva orden (`AdminOrderCreateForm`).
- [ ] `PaginationTable` / `data-table-*`: estilos de tabla del §F (header gris, filas, paginación 34px).

## Comprobaciones finales
- [ ] Lighthouse móvil: Accesibilidad ≥ 95 (contraste, tamaños táctiles, labels/aria en botones de icono: favoritos, carrito, menú, cerrar, compartir).
- [ ] Sin `#ff0000`, `bg-red-500` para descuentos, `text-primary-900` (índigo) ni `font-sora` restantes.
- [ ] Imágenes con `sizes` correctos para la nueva rejilla (`(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw`) y hero con `priority`.
- [ ] `prefers-reduced-motion` desactiva el zoom de imágenes.
- [ ] Los tests existentes (`Header.test.tsx`, `QuantityInput.test.tsx`, utils) pasan; actualiza snapshots/selectores si cambió el markup.
