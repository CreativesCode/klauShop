# Riesgos detectados en el analisis inicial (2026-09-24)

Detectados leyendo el codigo al instalar Titan Factory. NO corregidos todavia — esperan decision del usuario.

## Alta prioridad (afectan dinero o stock)
1. **Descuento no aplicado en el servidor.** El carrito muestra precio con `discount` (`UserCartSection.tsx`),
   pero `/api/checkout/whatsapp` y `/api/admin/orders/create` calculan subtotal y `order_lines.price` con `products.price`
   sin descuento. El total de la orden y el mensaje de WhatsApp pueden no coincidir con lo que vio el cliente.
2. **Cancelar via `change-status` no libera reservas.** `VALID_STATUS_TRANSITIONS` permite `* → cancelled`, pero
   `change-status` solo cambia el estado; las reservas quedan `active` (stock bloqueado para siempre) y en ordenes ya
   pagadas no se repone `products.stock`. El endpoint `cancel` si libera, pero no cubre ordenes pagadas.
3. **Chequeo de stock fuera de la transaccion.** `getAvailableStock` y `releaseReservations` usan `db` global, no `tx`;
   el lock `FOR UPDATE` sobre products no cubre la lectura de reservas.
4. **Stock por producto vs reservas por variante.** Disponible = stock total - reservas de ESA variante; reservas de
   otras variantes no restan. Posible sobreventa cuando un producto tiene varias tallas/colores.

## Media
5. `src/app/middleware.ts` esta en ubicacion invalida → no corre (ver reference/auth-y-datos.md).
6. `src/env.mjs` exige `S3_ENDPOINT` pero `.env.example` no lo lista.
7. Restos de Hiyori en `siteConfig` (url/email/telefono/nav) — afecta SEO y footer.

## Baja
8. `build` usa `graphql-codegen & next build` (un solo `&`: codegen corre en paralelo, no antes).
9. No hay script `typecheck`; tests Jest cubren solo 2 componentes.
10. Muchos `console.log` de depuracion en el checkout de produccion.
