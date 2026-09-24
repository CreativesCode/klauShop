-- ============================================================
-- WhatsApp notifications, adjustments over 0014:
--  - The OpenWA number does not answer, so customer messages list the
--    admins' phones to contact instead of "reply to this message".
--  - Customers no longer get the order link (guest / admin-created orders
--    are not reachable by them). Admins get the direct admin link.
-- ============================================================

-- "📞 Escríbele a un administrador: +53..., +53..." ('' if no admin has a phone)
CREATE OR REPLACE FUNCTION public.wa_admin_contacts()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    E'\n\n📞 Escríbele a un administrador: ' ||
      string_agg(DISTINCT btrim(pr.phone), ', '),
    '')
    FROM profiles pr
    JOIN auth.users u ON u.id = pr.id
   WHERE (u.raw_app_meta_data ->> 'isAdmin')::boolean IS TRUE
     AND nullif(btrim(pr.phone), '') IS NOT NULL;
$$;

-- Direct link to the order in the admin panel ('' if site_url is not set)
CREATE OR REPLACE FUNCTION public.wa_admin_order_url(p_order_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    E'\n\n🔗 ' || rtrim(value, '/') || '/admin/orders/' || p_order_id,
    '')
    FROM (SELECT (SELECT value FROM private_config WHERE key = 'site_url') AS value) s;
$$;

CREATE OR REPLACE FUNCTION public.wa_notify_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_number   text := public.wa_order_number(NEW.id);
  v_items    text;
  v_shipping text;
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

  v_shipping := CASE
    WHEN NEW.shipping_cost IS NULL THEN E'\n*Envío:* por definir'
    ELSE E'\n*Envío:* ' || public.wa_money(NEW.shipping_cost)
  END;

  -- Customer
  PERFORM public.send_wa(
    NEW.phone,
    E'🛍️ *Klau''s Shop*\n' ||
    '¡Hola' || coalesce(' ' || nullif(btrim(NEW.name), ''), '') || '! ' ||
    'Recibimos tu pedido *' || v_number || E'*.\n\n' ||
    coalesce(v_items || E'\n', '') ||
    v_shipping ||
    E'\n*Total:* ' || public.wa_money(NEW.amount) ||
    E'\n\nPronto un administrador te contactará para confirmarlo.' ||
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
      E'\nTotal: ' || public.wa_money(NEW.amount) ||
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

CREATE OR REPLACE FUNCTION public.wa_notify_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_number text := public.wa_order_number(NEW.id);
  v_body   text;
BEGIN
  v_body := CASE NEW.order_status
    WHEN 'pending_payment' THEN
      '✅ Tu pedido *' || v_number || '* fue confirmado. Total a pagar: *' ||
      public.wa_money(NEW.amount) || '*.'
    WHEN 'paid' THEN
      '💰 Recibimos el pago de tu pedido *' || v_number || '*. ¡Gracias!'
    WHEN 'processing' THEN
      '📦 Estamos preparando tu pedido *' || v_number || '*.'
    WHEN 'shipped' THEN
      '🚚 Tu pedido *' || v_number || '* va en camino.'
    WHEN 'delivered' THEN
      '🎉 Tu pedido *' || v_number || '* fue entregado. ¡Gracias por comprar en Klau''s Shop!'
    WHEN 'cancelled' THEN
      '❌ Tu pedido *' || v_number || '* fue cancelado.'
    ELSE NULL
  END;

  IF v_body IS NOT NULL THEN
    PERFORM public.send_wa(
      NEW.phone,
      E'*Klau''s Shop*\n' || v_body || public.wa_admin_contacts()
    );
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'wa_notify_order_status failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

-- Replaced by wa_admin_order_url (customers no longer get a link)
DROP FUNCTION IF EXISTS public.wa_order_url(text);

REVOKE ALL ON FUNCTION public.wa_admin_contacts()        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wa_admin_order_url(text)   FROM PUBLIC, anon, authenticated;
