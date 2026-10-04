-- 0025: Spanish color names in the new-order WhatsApp (pilot QA P5-03).
-- Manual migration (outside the drizzle-kit journal). Colors are stored as hex; customers read "fucsia",
-- not "#FF1493". Nearest color of the same palette as src/lib/colorName.ts (change both together).

CREATE OR REPLACE FUNCTION public.wa_color_name(p_color text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_hex text := lower(ltrim(btrim(coalesce(p_color, '')), '#'));
  v_rgb int;
  v_name text;
BEGIN
  IF v_hex !~ '^[0-9a-f]{6}$' THEN
    RETURN nullif(btrim(coalesce(p_color, '')), '');
  END IF;
  v_rgb := ('x' || v_hex)::bit(24)::int;
  SELECT p.name INTO v_name
    FROM (VALUES
    ('negro', x'000000'::int),
    ('blanco', x'FFFFFF'::int),
    ('gris', x'808080'::int),
    ('gris claro', x'D3D3D3'::int),
    ('rojo', x'FF0000'::int),
    ('vino', x'8B0000'::int),
    ('rosado', x'FFC0CB'::int),
    ('fucsia', x'FF1493'::int),
    ('naranja', x'FFA500'::int),
    ('amarillo', x'FFFF00'::int),
    ('dorado', x'D4AF37'::int),
    ('verde', x'008000'::int),
    ('verde claro', x'90EE90'::int),
    ('verde oliva', x'6B8E23'::int),
    ('turquesa', x'40E0D0'::int),
    ('azul claro', x'87CEEB'::int),
    ('azul', x'0000FF'::int),
    ('azul marino', x'000080'::int),
    ('morado', x'800080'::int),
    ('lila', x'C8A2C8'::int),
    ('marrón', x'8B4513'::int),
    ('beige', x'F5F5DC'::int)
    ) AS p(name, rgb)
   ORDER BY power(((v_rgb >> 16) & 255) - ((p.rgb >> 16) & 255), 2)
          + power(((v_rgb >> 8) & 255) - ((p.rgb >> 8) & 255), 2)
          + power((v_rgb & 255) - (p.rgb & 255), 2)
   LIMIT 1;
  RETURN v_name;
END;
$$;

-- New-order WhatsApp (live body, only the color in the items line changes)
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
           coalesce(' (' || nullif(concat_ws(', ', public.wa_color_name(ol.color), ol.size, ol.material), '') || ')', '') ||
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
