-- ============================================================
-- Automatic WhatsApp notifications via OpenWA.
--
-- Flow: trigger on orders -> pg_net (async, after commit) -> OpenWA send-text.
-- No Edge Function and no Vercel work: the request that changes the order
-- never waits for WhatsApp, and a WhatsApp failure never breaks the order.
--
-- Credentials live in private_config (RLS without policies + revoked grants:
-- only service_role / security definer functions can read it).
-- Kill switch: delete the 'openwa_base_url' row and nothing is sent.
--
-- Manual setup after applying (SQL editor, service role):
--   insert into public.private_config (key, value) values
--     ('openwa_base_url',   'https://wa.your-domain.com/api'),
--     ('openwa_api_key',    'owa_xxx'),
--     ('openwa_session_id', '<session UUID, not the name>'),
--     ('site_url',          'https://your-store-domain.com')
--   on conflict (key) do update set value = excluded.value;
-- ============================================================

-- pg_net exposes its functions in the `net` schema (not `extensions`)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Admin phone to receive new-order notifications
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "phone" text;

CREATE TABLE IF NOT EXISTS "private_config" (
  "key"   text PRIMARY KEY,
  "value" text NOT NULL
);
ALTER TABLE "private_config" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "private_config" FROM anon, authenticated;

-- ------------------------------------------------------------
-- Phone -> OpenWA chatId. Cuba by default (53):
--   "+53 5xxxxxxx" -> 535xxxxxxx@c.us   (international format is trusted)
--   "0053..."      -> 53...@c.us
--   "5xxxxxxx"     -> 535xxxxxxx@c.us   (8 local digits -> prepend 53)
--   anything else  -> digits as-is (assumed to include the country code)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wa_phone_to_chat_id(p_phone text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
BEGIN
  IF length(v_digits) < 8 THEN
    RETURN NULL;
  END IF;
  IF btrim(p_phone) LIKE '+%' THEN
    RETURN v_digits || '@c.us';
  END IF;
  IF v_digits LIKE '00%' THEN
    RETURN substr(v_digits, 3) || '@c.us';
  END IF;
  IF length(v_digits) = 8 THEN
    RETURN '53' || v_digits || '@c.us';
  END IF;
  RETURN v_digits || '@c.us';
END;
$$;

-- ------------------------------------------------------------
-- Queue a WhatsApp text through OpenWA. Never raises: a WhatsApp problem
-- must not abort the order transaction.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_wa(p_phone text, p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_chat_id text := public.wa_phone_to_chat_id(p_phone);
  v_base    text;
  v_key     text;
  v_session text;
BEGIN
  IF v_chat_id IS NULL OR coalesce(btrim(p_message), '') = '' THEN
    RETURN;
  END IF;

  SELECT value INTO v_base    FROM private_config WHERE key = 'openwa_base_url';
  SELECT value INTO v_key     FROM private_config WHERE key = 'openwa_api_key';
  SELECT value INTO v_session FROM private_config WHERE key = 'openwa_session_id';
  IF v_base IS NULL OR v_key IS NULL OR v_session IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := rtrim(v_base, '/') || '/sessions/' || v_session || '/messages/send-text',
    body := jsonb_build_object('chatId', v_chat_id, 'text', p_message),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', v_key
    ),
    timeout_milliseconds := 15000
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'send_wa failed: %', SQLERRM;
END;
$$;

-- Same format as formatOrderNumber() in src/features/orders/utils/whatsapp.ts
CREATE OR REPLACE FUNCTION public.wa_order_number(p_order_id text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'KS-' || upper(right(p_order_id, 4));
$$;

-- Link handled by /order/[orderId] (redirects admin vs customer)
CREATE OR REPLACE FUNCTION public.wa_order_url(p_order_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN value IS NULL THEN ''
    ELSE E'\n\n🔗 ' || rtrim(value, '/') || '/order/' || p_order_id
  END
  FROM (SELECT (SELECT value FROM private_config WHERE key = 'site_url') AS value) s;
$$;

CREATE OR REPLACE FUNCTION public.wa_money(p_amount numeric)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT to_char(coalesce(p_amount, 0), 'FM999999990.00') || ' CUP';
$$;

-- ------------------------------------------------------------
-- New order -> customer + admins.
-- Deferred constraint trigger: runs at COMMIT, so order_lines (inserted
-- after the order in the same transaction) are already visible.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wa_notify_new_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_number   text := public.wa_order_number(NEW.id);
  v_url      text := public.wa_order_url(NEW.id);
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
    E'\n\nTe escribiremos pronto para confirmarlo.' ||
    v_url
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
      v_url
    );
  END LOOP;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'wa_notify_new_order failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_order_created_wa ON public.orders;
CREATE CONSTRAINT TRIGGER on_order_created_wa
  AFTER INSERT ON public.orders
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.wa_notify_new_order();

-- ------------------------------------------------------------
-- Status change -> customer. Covers change-status, mark-paid and cancel.
-- pending_confirmation is only the initial status, so it has no message.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wa_notify_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_number text := public.wa_order_number(NEW.id);
  v_body   text;
BEGIN
  v_body := CASE NEW.order_status
    WHEN 'pending_payment' THEN
      '✅ Tu pedido *' || v_number || '* fue confirmado. Total a pagar: *' ||
      public.wa_money(NEW.amount) ||
      E'*.\nResponde a este mensaje si tienes dudas sobre el pago.'
    WHEN 'paid' THEN
      '💰 Recibimos el pago de tu pedido *' || v_number || '*. ¡Gracias!'
    WHEN 'processing' THEN
      '📦 Estamos preparando tu pedido *' || v_number || '*.'
    WHEN 'shipped' THEN
      '🚚 Tu pedido *' || v_number || '* va en camino.'
    WHEN 'delivered' THEN
      '🎉 Tu pedido *' || v_number || '* fue entregado. ¡Gracias por comprar en Klau''s Shop!'
    WHEN 'cancelled' THEN
      '❌ Tu pedido *' || v_number || E'* fue cancelado.\nSi tienes dudas, responde a este mensaje.'
    ELSE NULL
  END;

  IF v_body IS NOT NULL THEN
    PERFORM public.send_wa(
      NEW.phone,
      E'*Klau''s Shop*\n' || v_body || public.wa_order_url(NEW.id)
    );
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'wa_notify_order_status failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_wa ON public.orders;
CREATE TRIGGER on_order_status_wa
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION public.wa_notify_order_status();

-- ------------------------------------------------------------
-- Functions in `public` are exposed by PostgREST (rpc) and pg_graphql.
-- Nobody outside the triggers may send messages or read the config.
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.wa_phone_to_chat_id(text)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_wa(text, text)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wa_order_number(text)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wa_order_url(text)          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wa_money(numeric)           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wa_notify_new_order()       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.wa_notify_order_status()    FROM PUBLIC, anon, authenticated;
