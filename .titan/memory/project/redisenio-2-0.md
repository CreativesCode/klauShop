# Rediseño 2.0 (en curso desde 2026-10-20)

Spec: `docs/design/design_handoff_klaushop_redesign/` (el dueño lo aportó; aún sin commitear en git).
Plan y estado detallado: `.titan/plans/redisenio-2-0.md`.

**Estado 2026-10-20:** Fases 0–3 hechas y Fase 4 a medias (tienda parte 1). Commits locales en `main`, **sin push**.
Pendiente: resto de tienda (confirmación, encargos, sobre nosotros, settings, 404), auth y todas las listas/formularios
del admin (productos, colecciones, multimedia, usuarios, zonas, nueva orden).

## Reglas nuevas (respetarlas en código nuevo)
- Precios visibles: `formatCUP()` de `src/lib/utils.ts` ("4.500 CUP"). WhatsApp/JSON-LD/exports: `formatPrice()`.
- Tokens Tailwind nuevos: `ink`, `cream`, `line`, `surface.*`, `max-w-store` (1320) / `max-w-admin` (1400),
  `shadow-cta/drawer/toast/seg`, `grid-cols-products`, `ease-soft`, `rounded-4xl`. `primary-950` = #2E1065.
- Tienda: botones píldora (`size="lg"|"xl"`); admin: `size="sm"|"default"` (10px). Ámbar nunca como texto sobre blanco
  (usar `accent-700`). Texto mínimo 12px; inputs 16px en móvil.
- Estado de orden en UI: `StatusPill` (`features/orders/components/StatusPill.tsx`) con `shortLabel`/`dot` de
  `ORDER_STATUS_INFO`. Siguiente acción: `OrderNextActionButton` (lógica en `useOrderQuickActions`).
- Contenedor de página de tienda: `Shell`. Encabezado de página admin: `AdminShell` (`actions`, `breadcrumb`).
- Manrope = archivos estáticos de `@fontsource/manrope` (no Google variable): ver plan.
- El admin ya no reduce `html` a 14px.
