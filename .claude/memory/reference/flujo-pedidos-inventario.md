# Flujo de pedidos e inventario

## Creacion (cliente)
`POST /api/checkout/whatsapp` (`src/app/api/checkout/whatsapp/route.ts`):
1. Valida con `createWhatsAppOrderSchema` (`src/features/orders/validations`).
2. En `db.transaction`: `SELECT ... FOR UPDATE` de productos → `getAvailableStock` por item/variante →
   inserta `orders` (`pending_confirmation`, `unpaid`, `payment_method: "whatsapp"`, `currency: "cup"`) →
   `order_lines` → `createReservation` por item (status `active`).
3. Genera mensaje + URL de WhatsApp (`src/features/orders/utils/whatsapp.ts`) con link `/order/:id`.
4. Borra el carrito del usuario logueado (no critico si falla).
Funciona para invitados (user_id null) y usuarios logueados.

## Gestion (admin) — endpoints en `src/app/api/admin/orders/[orderId]/`
- `change-status`: valida `VALID_STATUS_TRANSITIONS` (`src/features/orders/utils/orderStatus.tsx`).
  Rechaza `paid` y bloquea processing/shipped/delivered si `payment_status != paid`.
- `mark-paid`: `consumeReservationsAndDeductStock` (reservas → `consumed`, resta `products.stock`) + `paid/paid`.
- `cancel`: `releaseReservations` (reservas → `released`). No permite cancelar ordenes `paid` por esta via.
- `update-shipping`: edita costo de envio. `create`: orden manual desde admin.

## Modelo de stock
- `products.stock` = stock fisico (a nivel producto, no por variante).
- Disponible = `stock - SUM(reservas active)`; las reservas guardan color/size/material.
- Variantes reales (skus/options) estan comentadas en el esquema: los colores/tallas/materiales son arrays JSON en `products`.

## Stripe (dormido)
`/api/create-checkout-session` + `/api/webhook` siguen en el codigo; el `CheckoutButton` de Stripe esta comentado
en `UserCartSection.tsx`. No reactivar sin decision del usuario.

Riesgos conocidos de este flujo: ver [riesgos-detectados-2026-09-24](../project/riesgos-detectados-2026-09-24.md).
