# Rediseño 2.0 (en curso desde 2026-10-20)

Spec: `docs/design/design_handoff_klaushop_redesign/` (el dueño lo aportó; aún sin commitear en git).
Plan y estado detallado: `.titan/plans/redisenio-2-0.md`.

**Estado 2026-10-20:** Fases 0–4 hechas (todas las vistas de tienda, auth y admin). Commits locales en `main`,
**sin push** (push = deploy a producción; lo decide el dueño). Queda: Lighthouse sobre el deploy, decidir push y si se
commitea `docs/design/`. Detalle y hallazgos en el plan.

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
- Listas admin: `AdminSearchField` / `adminChip` / `AdminTableView` de `components/admin/AdminTable.tsx`.
- Formularios admin: tarjetas 2fr/1fr + barra "Guardar" `sticky bottom-[calc(65px+env(safe-area-inset-bottom))] lg:bottom-0`.
- Auth: `AuthCard` (`@/features/auth`). `PasswordInput` ya usa 16px en móvil.
