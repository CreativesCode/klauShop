# 01 · Design tokens

Todos los valores exactos usados en los mocks. Código listo en `snippets/tailwind.config.ts`, `snippets/globals.css`, `snippets/layout.tsx`.

## Color

### Marca (sin cambios respecto al repo, solo se añaden roles)
| Token Tailwind | Hex | Rol |
|---|---|---|
| `primary` / `primary-600` | `#6D28D9` | Acción primaria, enlaces, ítem activo, barras del gráfico |
| `primary-700` | `#5B21B6` | Hover del primario, texto de marca, texto de enlace |
| `primary-800` | `#4C1D95` | Hover de enlaces |
| `primary-500` | `#8B5CF6` | — |
| `primary-300` | `#C4B5FD` | Bordes de foco, acento en fondo oscuro, botón deshabilitado |
| `primary-200` | `#DDD6FE` | Barras del gráfico no resaltadas, texto secundario sobre violeta oscuro |
| `primary-100` | `#EDE9FE` | Anillo de foco (`ring-4 ring-primary-100`), avatar |
| `primary-50` | `#F5F3FF` | Fondo de ítem activo, chips seleccionados, hover de nav |
| **`primary-950` (CAMBIA)** | `#2E1065` | Barra de anuncio superior, bloque "Encargos", drawer oscuro. Hoy `950` es `#312E81` (índigo) → reemplazar por `#2E1065` (violeta 950 real). `900` actual es `#4338CA` (índigo, no violeta): no usarlo en el rediseño. |
| `accent` / `accent-500` | `#F59E0B` | Descuentos, contadores (badge carrito, nav), CTA WhatsApp/encargos |
| `accent-400` | `#FBBF24` | Hover del CTA ámbar |
| `accent-300` | `#FCD34D` | Eyebrow sobre fondos oscuros/foto |
| `accent-700` | `#B45309` | Texto "Última unidad / Quedan N", "Envío por acordar", "Ahorras…" |
| `accent-800` | `#92400E` | Texto en píldora crema del hero |

### Neutros y superficies (nuevos / ajustados)
| Token | Hex | Rol |
|---|---|---|
| `ink` (nuevo) = `neutral-900` | `#111827` | Texto principal, botón oscuro, chip/pestaña activa |
| `neutral-700` | `#374151` | Texto de nav inactivo (admin), labels |
| `neutral-600` | `#4B5563` | Texto de párrafo secundario |
| `neutral-500` | `#6B7280` | Texto terciario/meta (mín. permitido sobre blanco) |
| `neutral-400` | `#9CA3AF` | Solo ejes de gráfico y chevrons decorativos |
| `neutral-300` | `#D1D5DB` | Borde de input y botón contorno |
| `neutral-200` | `#E5E7EB` | Borde de chips inactivos |
| `line` (nuevo) | `#ECEAF3` | Borde de tarjetas (tienda y admin) y separadores de header |
| `line-soft` (nuevo) | `#F1EFF6` / `#F3F2F7` | Separadores internos de filas / fondo de botón secundario admin |
| `surface-muted` (nuevo) | `#F4F2F8` | Fondo del buscador de la tienda, botón icono hover |
| `surface-tint` (nuevo) | `#F1EEF7` | Fondo placeholder de imágenes de producto |
| `cream` (nuevo) | `#FFF8EE` | Hero mosaico, cards de nota, caja "Cambios al recibir" |
| `cream-border` | `#F3E6CF` / `#E7DCC8` | Borde de la píldora del hero / botón contorno sobre crema |
| `background` tienda | `#FAFAFC` | `--background: 240 20% 98%` |
| `background` admin | `#F6F5FA` | Fondo de `admin/layout.tsx` (`bg-[#F6F5FA]`) |
| `card` | `#FFFFFF` | Tarjetas |

### Semánticos de estado de orden (coinciden con `orderStatus.tsx`, tailwind default)
| Estado | Label UI | Fondo | Texto | Punto/barra |
|---|---|---|---|---|
| `pending_confirmation` | Por confirmar | `#FEFCE8` yellow-50 | `#A16207` yellow-700 | `#EAB308` |
| `pending_payment` | Pendiente de pago | `#FFF7ED` orange-50 | `#C2410C` orange-700 | `#F97316` |
| `paid` | Pagada | `#F0FDF4` green-50 | `#15803D` green-700 | `#22C55E` |
| `processing` | Procesando | `#EFF6FF` blue-50 | `#1D4ED8` blue-700 | `#3B82F6` |
| `shipped` | Enviada | `#EEF2FF` indigo-50 | `#4338CA` indigo-700 | `#6366F1` |
| `delivered` | Entregada | `#ECFDF5` emerald-50 | `#047857` emerald-700 | `#10B981` |
| `cancelled` | Cancelada | `#FEF2F2` red-50 | `#B91C1C` red-700 | `#EF4444` |

> Nota: en `orderStatus.tsx` el label de `pending_confirmation` es "Pendiente de Confirmación". En las píldoras usa el label corto **"Por confirmar"** (añade un campo `shortLabel` a `OrderStatusInfo`, no cambies `label`, que se usa en otros sitios). Píldora = fondo + texto + punto `currentColor` de 6px; **sin borde** (hoy usan `variant="outline"` con borde).

Otros semánticos: éxito texto `#047857` sobre `#ECFDF5`; error texto `#B91C1C` sobre `#FEF2F2` borde `#FECACA`; aviso texto `#C2410C` sobre `#FFF7ED` borde `#FED7AA`; "Pagado" `#15803D`, "No pagado" `#B91C1C`, "Reembolsado/Cancelado" `#6B7280`.

## Tipografía

| Familia | Uso | Carga |
|---|---|---|
| **Manrope** | Toda la UI (tienda + admin). Reemplaza Sora. | `Manrope({ subsets:["latin"], variable:"--font-sans" })` |
| **Instrument Serif** | Títulos editoriales de la tienda: h1 del hero, títulos de banners, título de "Encargos". La palabra acento va en cursiva y violeta: `<em className="italic text-primary">día a día.</em>` (sobre foto oscura: `text-accent-300`). | `Instrument_Serif({ subsets:["latin"], weight:"400", style:["normal","italic"], variable:"--font-display" })` |

Pesos Manrope: 400 (raro), 500 cuerpo, 600 links/labels/nombre de producto, 700 botones/nav, 800 títulos, precios, valores KPI.

### Escala
| Nombre | Familia | Tamaño | Peso | Line-height | Tracking | Tailwind sugerido |
|---|---|---|---|---|---|---|
| Display hero | Serif | `clamp(48px, 7.2vw, 104px)` | 400 | 0.95 | -0.02em | `font-display text-[clamp(48px,7.2vw,104px)] leading-[.95] tracking-[-0.02em]` |
| Display banner | Serif | `clamp(40px, 4.4vw, 60px)` | 400 | 1 | 0 | |
| Display encargos | Serif | `clamp(38px, 4.6vw, 64px)` | 400 | 1 | -0.01em | |
| H1 admin / H1 producto | Manrope | `clamp(24px, 2.4vw, 32px)` / `clamp(26px,3vw,38px)` | 800 | 1.15 | -0.02em | |
| H2 sección tienda | Manrope | `clamp(22px, 2.2vw, 30px)` | 800 | 1.2 | -0.02em | |
| H2 tarjeta admin | Manrope | 15px | 800 | 1.3 | 0 | `text-[15px] font-extrabold` |
| Nombre producto (card) | Manrope | 15px | 600 | 1.35 | 0 | 2 líneas máx (`line-clamp-2`) |
| Cuerpo | Manrope | 15–17px (`clamp(15px,1.3vw,18px)` en hero) | 500 | 1.55–1.65 | 0 | |
| Texto UI / tabla | Manrope | 14px | 600 | 1.4 | 0 | |
| Precio card | Manrope | 16px | 800 | — | 0 | `tabular-nums` |
| Precio ficha | Manrope | `clamp(26px, 2.6vw, 32px)` | 800 | — | 0 | |
| Valor KPI | Manrope | `clamp(22px, 2vw, 28px)` | 800 | — | -0.02em | `tabular-nums` |
| Meta / categoría | Manrope | 12px | 600 | — | 0.06em | `uppercase` |
| Eyebrow | Manrope | 12px | 700–800 | — | 0.14em | `uppercase` |
| Header de tabla | Manrope | 12px | 700 | — | 0.05em | `uppercase text-neutral-500` |
| Badge | Manrope | 11–12px | 800 | — | 0.02em | |
| Mínimo absoluto | — | **12px** | — | — | — | Eliminar todos los `text-[10px]` |

## Espaciado
Escala base 4px (la de Tailwind). Patrones:
- Padding horizontal de página: `clamp(16px, 3vw, 32px)` tienda; `clamp(16px, 2.4vw, 32px)` admin. (≈ `px-4 md:px-6 xl:px-8`.)
- Ancho máximo contenido: **1320px** tienda (`max-w-[1320px] mx-auto`), **1400px** admin.
- Separación entre secciones de la tienda: `clamp(40px…88px)` (≈ `pt-12 md:pt-16 lg:pt-[88px]`).
- Gap de rejilla de productos: filas `clamp(24px,3vw,40px)`, columnas `clamp(12px,1.8vw,24px)`.
- Padding de tarjetas admin: 18–20px. Gap entre tarjetas admin: 12–18px (`gap-3 lg:gap-4`, columnas de detalle `gap-[18px]`).
- Header tienda: 14px vertical / 32px horizontal; altura controles 44px.

## Radios
| Uso | Valor |
|---|---|
| Botones tienda, chips, pills, buscador tienda | `9999px` (`rounded-full`) |
| Botones y controles admin | `10px`–`12px` (`rounded-[10px]`, `rounded-xl`) |
| Inputs de formulario | `12px` |
| Imágenes de producto (card) | `18px` |
| Imagen principal ficha | `24px` |
| Tarjetas admin | `18px` |
| Hero / banners / bloque encargos (tienda) | `clamp(20px, 2.4vw, 32px)` hero; `28px` banners |
| Thumbnails | `12px` |
| Contenedores icono | `11–12px` |

`--radius` pasa de `0.75rem` a `1.125rem` (18px) → `rounded-lg` = 18px, `rounded-md` = 16px, `rounded-sm` = 14px. Revisa componentes shadcn que usen `rounded-md` en controles pequeños (dropdown items, select) y fíjalos a `rounded-[10px]` si se ven demasiado redondos.

## Bordes y sombras
- Borde de tarjeta: `1px solid #ECEAF3`. Header sticky: `border-b #EEEAF6`.
- **Sin `shadow-sm` por defecto en `Card`** (quitarlo).
- Sombra CTA primario: `0 8px 24px -8px rgba(109,40,217,.55)`.
- Sombra drawer: `-20px 0 60px -20px rgba(17,24,39,.35)`. Toast: `0 12px 32px -8px rgba(17,24,39,.4)`.
- Elementos flotantes sobre imagen: `bg-white/90 backdrop-blur`.
- Headers sticky: `bg-white/85 backdrop-blur-[14px] backdrop-saturate-[1.8]` (tienda) / `bg-[#F6F5FA]/90 backdrop-blur-md` (admin).

## Movimiento
- Hover de imagen de producto: `scale(1.04)` en 600ms `cubic-bezier(.2,.7,.2,1)`.
- Transiciones de color/fondo: 150ms.
- Sidebar colapsar: `width .2s`.
- Sin animaciones al hacer scroll, sin parallax. Respetar `prefers-reduced-motion` (desactivar el zoom).

## Breakpoints
Tailwind por defecto sirve. Mapeo con los mocks:
- Tienda: layout móvil `< md (768px)` (los mocks usan 820px; usa `md`). Header de escritorio, sin tab bar inferior a partir de `md`.
- Admin: layout móvil `< lg (1024px)`... los mocks cambian a 900px; usa **`lg`** para mostrar sidebar y tabla; por debajo, tab bar inferior + tarjetas.
- Grids intermedios: `grid-cols-[repeat(auto-fill,minmax(max(156px,calc((100%-72px)/4)),1fr))]` (máx 4 columnas, mín 156px → 2 columnas en 390px).

## Scrollbar
Eliminar la regla global de 2px de `globals.css`. Para carruseles horizontales usar una utilidad `.no-scrollbar` (ver `snippets/globals.css`).
