# Negocio: Klau's Shop

- Tienda online de ropa y accesorios ("Tu tienda favorita de ropa y accesorios").
- Mercado: **Cuba**, zona de Villa Clara. Zonas de entrega declaradas en `siteConfig.zones`:
  Santa Clara, Placetas, Encrucijada y Calabazar de Sagua. Costos de envio por zona en tabla `shipping_zones` (editable en /admin/shipping-zones).
- Moneda **CUP**. Todo el copy en espanol.
- Modelo de venta: el cliente arma el carrito → "Pedir por WhatsApp" → se crea la orden con stock reservado →
  se abre WhatsApp al numero de la tienda (`siteConfig.whatsappPhone`) con el resumen y un link `/order/:id`.
  El pago ocurre **fuera de la app**; el admin confirma y marca pagada.
- Existe pagina `/special-orders` (pedidos por encargo).
- Numero de orden visible: prefijo `KS-` (`siteConfig.orderPrefix`).

## Origen del codigo
- Fork de **Hiyori** (clonglam/HIYORI-master, autor CLong Lam, 2024) — e-commerce Next 14 + Supabase + GraphQL + Stripe.
- Media: Supabase Storage (API S3-compatible, bucket `klaushop`), NO Amazon S3 pese a los nombres `S3_*`.
- Adaptado a Klau's Shop por Roberto Cabrera Alvarez desde ~2025-12 (checkout WhatsApp, CUP, zonas de envio,
  reservas de inventario, descuentos, admin localizado al espanol, SEO).
- Quedan restos de Hiyori en `src/config/site.ts` (url, address, phone, email, `mainNav` apuntando a github/hugo-coding)
  y en `README.md` / `next.config.mjs` (bucket `hiyori-backpack`). Pendiente de limpiar cuando el usuario lo pida.
