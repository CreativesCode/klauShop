-- 0019: new-order WhatsApp copy for "envío a acordar" and "recogida en tienda" (pilot QA SN-04/SN-08).
-- Manual migration (outside the drizzle-kit journal). Same body as 0015 except the shipping/total lines.
-- shipping_cost NULL = cost agreed over WhatsApp: the amount is only the subtotal ("+ envío").
-- 'Recogida en tienda' must match PICKUP_ZONE_NAME in src/features/shipping/utils/matchShippingZone.ts.
-- Confirming an order now requires a shipping cost (change-status / mark-paid), so the
-- "Total a pagar" in wa_notify_order_status is always the final amount.

CREATE OR REPLACE FUNCTION public.wa_notify_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_number   text := public.wa_order_number(NEW.id);
  v_items    text;
  v_shipping text;
  v_total    text;
  v_admin_shipping text;
  v_admin    record;
BEGIN
  SELECT string_agg(
           '• ' || coalesce(p.name, 'Producto') || ' x' || ol.quantity ||
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
$$;
