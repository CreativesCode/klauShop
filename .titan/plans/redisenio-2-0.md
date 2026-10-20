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
| 4 Propagación — resto | — | **Pendiente** (ver lista) |
| Comprobaciones finales (Lighthouse, grep de restos) | — | Pendiente |

### Fase 4 — pendiente
- [ ] Tienda: `orders/confirmation` (¡no tocar la lógica del botón WhatsApp de iOS!), `special-orders`, `about-us`,
      `setting/*` (perfil, cuenta, direcciones + `AddressCard/Form/List`), `not-found.tsx`.
- [ ] Auth: `sign-in`, `sign-up`, `reset-password`, `error` (tarjeta 420px rounded-[28px], botones xl, inputs 46px).
- [ ] Admin: productos (lista `ProductsDataTable/Columns` + `ProductForm`), colecciones (lista + `CollectionForm`, mantener
      `<Suspense>`), multimedia (`ImageGrid` tiene `text-[10px]`, `UploadMediaContainer`, `ImageDialog` mantener
      `max-h-[90dvh]`), usuarios (lista, `AdminUserForm`/`UpdateUserForm` con placeholders en inglés), zonas de envío,
      nueva orden (`AdminOrderCreateForm`). Patrón: AdminShell (H1 + descripción + acciones) + tarjeta blanca con toolbar
      + tabla; en < lg filas → tarjetas; formularios en tarjetas 2fr/1fr con barra fija "Guardar" en móvil.
- [ ] Textos en inglés restantes: `FilterSheet.tsx` (¿se usa?), `carousel.tsx` sr-only, `multi-select.tsx`.
- [ ] Comprobaciones finales del handoff (§ Comprobaciones finales de `docs/04-PLAN.md`).

## Decisiones tomadas (avisar al dueño)
- **Manrope sale de `@fontsource/manrope` (archivos estáticos por peso) con `next/font/local`**, no de Google: Google
  solo sirve Manrope variable y WebKit sin soporte de fuentes variables (iOS viejos; también el WebKit de Playwright en
  Windows) lo pinta todo en ExtraLight. Instrument Serif sí viene de `next/font/google` (es estática).
- **El admin ya no fija `html{font-size:14px}`**: el diseño usa px sobre la base de 16px de Tailwind.
- **Precios en UI con `formatCUP()` ("4.500 CUP", sin decimales)**; WhatsApp, JSON-LD, metadata y exportaciones siguen
  con `formatPrice()` / `toFixed(2)`.
- **Carrito como drawer: NO implementado.** `CartSheet` era un placeholder vacío (quitado del layout; el archivo
  sigue). El carrito sigue siendo la página `/cart` con la estética del drawer (lista + resumen sticky que en móvil es
  barra fija). La zona y el total siguen eligiéndose en el diálogo de checkout existente (no se duplicó el flujo de
  WhatsApp/iOS). Si el dueño quiere el drawer, es trabajo aparte.
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
`git grep TEMP-ADMIN-PREVIEW HEAD -- src` (debe salir vacío).

## Aprendizajes
- Los heredocs con comillas raras fallan en el Bash de esta máquina: escribir scripts/fragmentos con la herramienta Write
  y empalmar con un script Python.
- En CSS grid sin `grid-cols-1`, la columna implícita crece con el contenido y provoca scroll horizontal en móvil.
- Diálogos (Radix portal) dentro de un `<Link>`: sus eventos burbujean al Link → mantener los botones con diálogo fuera
  de los enlaces.
- Las capturas del admin con `networkidle` no terminan nunca (peticiones abiertas): usar `load` + espera.
- Subconsultas en `sql\`\`` de Drizzle: usar nombres de columna literales calificados (`"orders"."id"`).
