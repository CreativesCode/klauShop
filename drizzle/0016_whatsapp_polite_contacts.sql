-- Friendlier wording for the admin contact line in customer WhatsApp messages
CREATE OR REPLACE FUNCTION public.wa_admin_contacts()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    E'\n\n💬 Si tienes alguna duda o pregunta, con gusto te ayudamos. ' ||
      'Puedes escribirle a un administrador: ' ||
      string_agg(DISTINCT btrim(pr.phone), ', '),
    '')
    FROM profiles pr
    JOIN auth.users u ON u.id = pr.id
   WHERE (u.raw_app_meta_data ->> 'isAdmin')::boolean IS TRUE
     AND nullif(btrim(pr.phone), '') IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.wa_admin_contacts() FROM PUBLIC, anon, authenticated;
