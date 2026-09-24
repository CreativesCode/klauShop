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

## Precios en order_lines
- `price` = precio unitario FINAL cobrado (con descuento, via `getDiscountedUnitPrice` en `src/features/orders/utils/pricing.ts`).
- `list_price` = precio de lista al comprar (nullable: la ruta Stripe dormida no lo rellena); `discount` = % aplicado.
- UI: componente `OrderLinePrice` (admin detalle, cliente detalle, OrdersList) y el mensaje de WhatsApp muestran los tres.
- Migraciones manuales en `drizzle/00xx_*.sql` (el journal de drizzle-kit esta desfasado; no confiar en `db:generate`).

## Gestion (admin) — endpoints en `src/app/api/admin/orders/[orderId]/`
Fuente unica: `VALID_STATUS_TRANSITIONS` + `ORDER_STATUS_ACTIONS` (copy de botones) en `src/features/orders/utils/orderStatus.tsx`.
- pending_confirmation → pending_payment ("Confirmar orden") | paid (atajo) | cancelled
- pending_payment → paid | cancelled;  paid → processing | cancelled;  processing → shipped | cancelled
- shipped → delivered (NO cancelable);  delivered/cancelled finales
- `change-status`: resto de transiciones; rechaza `paid` y `cancelled`.
- `mark-paid`: consume reservas y resta stock (tolera legacy order_status=paid/payment unpaid).
- `cancel`: libera reservas activas y repone stock de las consumidas. payment_status queda `paid` si lo estaba
  (reembolso fuera de la app); el dashboard excluye canceladas de ingresos.
- `update-shipping`: edita costo de envio. `create`: orden manual desde admin.
- Etiquetas: `getOrderStatusLabel`, `getPaymentStatusInfo`, `getPaymentMethodLabel` — nunca mostrar el enum crudo.
- Admin usa `html{font-size:14px}` desde `src/app/(admin)/layout.tsx` (UI mas densa); la tienda sigue en 16px.

## Modelo de stock
- `products.stock` = stock fisico (a nivel producto, no por variante).
- Disponible = `stock - SUM(reservas active)`; las reservas guardan color/size/material.
- Variantes reales (skus/options) estan comentadas en el esquema: los colores/tallas/materiales son arrays JSON en `products`.

## Stripe (dormido)
`/api/create-checkout-session` + `/api/webhook` siguen en el codigo; el `CheckoutButton` de Stripe esta comentado
en `UserCartSection.tsx`. No reactivar sin decision del usuario.

Riesgos conocidos de este flujo: ver [riesgos-detectados-2026-09-24](../project/riesgos-detectados-2026-09-24.md).
