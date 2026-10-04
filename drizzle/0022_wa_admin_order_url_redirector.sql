-- 0022: the admin WhatsApp link points to the /order/{id} redirector (pilot QA P1-09).
-- Manual migration (outside the drizzle-kit journal). Same function as 0015, only the path changes.
-- /order/{id} sends a logged-out admin to /sign-in?redirect=/order/{id} and, after login,
-- on to /admin/orders/{id}; the old /admin/orders/{id} link lost the order on the way.

CREATE OR REPLACE FUNCTION public.wa_admin_order_url(p_order_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    E'\n\n🔗 ' || rtrim(value, '/') || '/order/' || p_order_id,
    '')
    FROM (SELECT (SELECT value FROM private_config WHERE key = 'site_url') AS value) s;
$$;
