-- 0024: variant (color/size/material) on order_lines (pilot QA P4-01).
-- Manual migration (outside the drizzle-kit journal). Additive: the columns are nullable and
-- the code that writes them can be deployed before or after (Drizzle needs them once schema.ts has them:
-- apply BEFORE deploying). Order details used to guess the variant from the reservations, which
-- picked the wrong one when an order had 2 variants of the same product.

ALTER TABLE public.order_lines
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS material text;

-- Backfill: in existing orders each (order, product) has exactly one line and one reservation
UPDATE public.order_lines ol
   SET color = r.color, size = r.size, material = r.material
  FROM public.inventory_reservations r
 WHERE r.order_id = ol."orderId"
   AND r.product_id = ol.product_id
   AND ol.color IS NULL AND ol.size IS NULL AND ol.material IS NULL
   AND (SELECT count(*) FROM public.inventory_reservations r2
         WHERE r2.order_id = ol."orderId" AND r2.product_id = ol.product_id) = 1;

-- New-order WhatsApp: show the variant next to each product (live body, only the items line changes)
CREATE OR REPLACE FUNCTION public.wa_notify_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_number   text := public.wa_order_number(NEW.id);
  v_items    text;
  v_shipping text;
  v_total    text;
  v_admin_shipping text;
  v_admin    record;
BEGIN
  SELECT string_agg(
           '• ' || coalesce(p.name, 'Producto') ||
           coalesce(' (' || nullif(concat_ws(', ', ol.color, ol.size, ol.material), '') || ')', '') ||
           ' x' || ol.quantity ||
           ' — ' || public.wa_money(ol.price),
           E'\n' ORDER BY ol.created_at)
    INTO v_items
    FROM order_lines ol
    LEFT JOIN products p ON p.id = ol.product_id
   WHERE ol."orderId" = NEW.id;

  IF NEW.shipping_cost IS NULL THEN
    v_shipping := E'\n*Envío:* a acordar por WhatsApp';
    v_total := public.wa_money(NEW.amount) || ' + envío';
    v_admin_shipping := E'\nEnvío: POR ACORDAR (contactar al cliente)';
  ELSIF NEW.shipping_cost = 0 AND lower(btrim(coalesce(NEW.zone, ''))) = 'recogida en tienda' THEN
    v_shipping := E'\n*Envío:* recogida en tienda (sin costo)';
    v_total := public.wa_money(NEW.amount);
    v_admin_shipping := E'\nEnvío: recogida en tienda';
  ELSE
    v_shipping := E'\n*Envío:* ' || public.wa_money(NEW.shipping_cost);
    v_total := public.wa_money(NEW.amount);
    v_admin_shipping := E'\nEnvío: ' || public.wa_money(NEW.shipping_cost);
  END IF;

  -- Customer
  PERFORM public.send_wa(
    NEW.phone,
    E'🛍️ *Klau''s Shop*\n' ||
    '¡Hola' || coalesce(' ' || nullif(btrim(NEW.name), ''), '') || '! ' ||
    'Recibimos tu pedido *' || v_number || E'*.\n\n' ||
    coalesce(v_items || E'\n', '') ||
    v_shipping ||
    E'\n*Total:* ' || v_total ||
    CASE
      WHEN NEW.shipping_cost IS NULL
        THEN E'\n\nPronto un administrador te contactará para acordar el envío y confirmar tu pedido.'
      ELSE E'\n\nPronto un administrador te contactará para confirmarlo.'
    END ||
    public.wa_admin_contacts()
  );

  -- Admins (app_metadata.isAdmin) with a phone in their profile
  FOR v_admin IN
    SELECT pr.phone
      FROM profiles pr
      JOIN auth.users u ON u.id = pr.id
     WHERE (u.raw_app_meta_data ->> 'isAdmin')::boolean IS TRUE
       AND nullif(btrim(pr.phone), '') IS NOT NULL
  LOOP
    PERFORM public.send_wa(
      v_admin.phone,
      E'🔔 *Nuevo pedido ' || v_number || E'*\n' ||
      'Cliente: ' || coalesce(NEW.name, '—') ||
      coalesce(' (' || NEW.phone || ')', '') ||
      E'\nZona: ' || coalesce(NEW.zone, '—') ||
      v_admin_shipping ||
      E'\nTotal: ' || v_total ||
      coalesce(E'\n\n' || v_items, '') ||
      public.wa_admin_order_url(NEW.id)
    );
  END LOOP;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'wa_notify_new_order failed: %', SQLERRM;
  RETURN NULL;
END;
$function$;
