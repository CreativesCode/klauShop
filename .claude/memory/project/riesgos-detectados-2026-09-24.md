# Riesgos detectados en el analisis inicial (2026-09-24)

Detectados leyendo el codigo al instalar Titan Factory. NO corregidos todavia — esperan decision del usuario.

## Alta prioridad (afectan dinero o stock)
1. ~~**Descuento no aplicado en el servidor.**~~ **RESUELTO 2026-09-24:** helper `getDiscountedUnitPrice`
   (`src/features/orders/utils/pricing.ts`, redondeo a centavos por unidad) usado en `/api/checkout/whatsapp`,
   `/api/admin/orders/create` y `AdminOrderCreateForm`. `order_lines.price` guarda el precio YA descontado.
   Desde migracion 0013 `order_lines` guarda tambien `list_price` y `discount` (%); se muestran con `OrderLinePrice`.
   Ordenes anteriores: backfill `list_price = price`, `discount = 0` (se cobraron a precio de lista).
2. ~~**Cancelar via `change-status` no libera reservas.**~~ **RESUELTO 2026-09-24:** `change-status` rechaza `paid` y `cancelled`;
   `cancel` valida con `VALID_STATUS_TRANSITIONS`, libera reservas activas y repone stock de las consumidas (ordenes pagadas).
3. **[CODIGO LISTO 2026-09-24, sin deploy]** **Chequeo de stock fuera de la transaccion.** `getAvailableStock` usa `db` global (`releaseReservations` ya recibe `tx`), no `tx`;
   el lock `FOR UPDATE` sobre products no cubre la lectura de reservas.
4. **[CODIGO LISTO 2026-09-24, sin deploy]** **Stock por producto vs reservas por variante.** Disponible = stock total - reservas de ESA variante; reservas de
   otras variantes no restan. Posible sobreventa cuando un producto tiene varias tallas/colores.

   Evidencia real (2026-09-24): "Lapiceros" stock 8 con reservas activas #FF4500 y #00FF00 → para #0000FF muestra 8, no 6.
   Tambien: varias lineas del MISMO producto en un carrito se validan por separado (reservas se crean despues) → sobreventa.
   El storefront/admin filtran por `products.stock` fisico, no por disponible.

## Seguridad (hallado 2026-09-24, CRITICO) — RESUELTO: 0017 aplicada en prod 2026-09-24 (verificado: anon no puede escribir)
- `shipping_zones` e `inventory_reservations` con RLS DESACTIVADO y grants completos a `anon`/`authenticated`:
  cualquiera con la anon key (publica) puede cambiar costos de envio o borrar reservas via PostgREST.
  Politicas de shipping_zones existen en `drizzle/rls_policies.sql` pero no estan aplicadas; las de reservas estan comentadas.
  La app accede a ambas via Drizzle (rol postgres, ignora RLS), asi que habilitar RLS no rompe la app.

## Envios (hallado 2026-09-24) — unificado en codigo (sin deploy) + 0017 aplicada; 5 pendientes de Placetas pasadas a envio NULL (ver reference/flujo-pedidos-inventario.md)
- El checkout confia en `shippingCost` enviado por el navegador (no lo resuelve en servidor).
- Zonas referenciadas por NOMBRE (texto libre) en orders/address: renombrar una zona rompe el match
  (ej. "Santa Clara" vs zonas actuales "Santa Clara - Dentro/Fuera de la Circumbalacion").
- Form admin de orden: zona texto libre, envio manual con default 0 → 6 ordenes de Placetas con envio 0.00 (zona cuesta 150).
- Logica de selector de zonas triplicada (CustomerInfoForm, AddressForm, WhatsAppCheckoutButton).
- Subtotal: admin detalle = suma de lineas; cliente/OrdersList = amount - shipping.
- `orders.customer_data` esta guardado como JSON doble-codificado (string); Drizzle lo re-parsea al leer, SQL/GraphQL ven un string.

## Media
5. `src/app/middleware.ts` esta en ubicacion invalida → no corre (ver reference/auth-y-datos.md).
6. `src/env.mjs` exige `S3_ENDPOINT` pero `.env.example` no lo lista.
7. Restos de Hiyori en `siteConfig` (url/email/telefono/nav) — afecta SEO y footer.

## Baja
8. `build` usa `graphql-codegen & next build` (un solo `&`: codegen corre en paralelo, no antes).
9. No hay script `typecheck`; tests Jest cubren solo 2 componentes.
10. Muchos `console.log` de depuracion en el checkout de produccion.
