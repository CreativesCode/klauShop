-- 0018: close RLS holes found in the 2026-10-02 pilot QA (P0-02, P0-03).
-- Manual migration (outside the drizzle-kit journal, like 0013-0017). Apply in one transaction.
--
-- The app reads/writes orders, order_lines and profiles through Drizzle (postgres role) or the
-- service-role GraphQL client, both of which bypass RLS. The anon/authenticated roles only need:
--   * customers: read their own orders/order_lines/profile (+ update own name/phone)
--   * admins (JWT app_metadata.isAdmin): everything via the "Admin manage ..." policies
--
-- Requires the app change that moves /admin/orders to getServiceClient() to be deployed first,
-- otherwise the admin orders list (which used the anon client) shows nothing.

-- 1. Admin check from the JWT (app_metadata is only writable with the service role),
--    not from profiles.is_admin (which users could update on their own row).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'isAdmin')::boolean, false);
$$;

DO $$
BEGIN
  IF to_regprocedure('public.is_admin(uuid)') IS NOT NULL THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SET search_path = ''
      AS $b$
        SELECT user_id = auth.uid()
          AND coalesce((auth.jwt() -> 'app_metadata' ->> 'isAdmin')::boolean, false);
      $b$;
    $f$;
  END IF;
END $$;

-- 2. orders / order_lines: drop the open policies (TO public, USING true).
--    The service role bypasses RLS, so "Service role can manage ..." was only opening the table to anon.
DROP POLICY IF EXISTS "Service role can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage all order_lines" ON public.order_lines;
DROP POLICY IF EXISTS "Authenticated users can view all order_lines" ON public.order_lines;
-- Orders are created only by /api/checkout/whatsapp and /api/admin/orders/create (Drizzle).
-- Letting users insert their own rows allowed arbitrary amounts/statuses (and WhatsApp triggers).
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create own order lines" ON public.order_lines;

-- 3. profiles: only the owner (and admins) can read; users may edit only name/phone.
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- collections had a duplicate admin policy based on profiles.is_admin
DROP POLICY IF EXISTS "Enable all access for admins" ON public.collections;

-- 4. Table privileges: anon never writes; authenticated writes only carts, wishlist, address, comments
--    (all scoped by their own RLS policies). TRUNCATE is not covered by RLS at all.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.orders, public.order_lines, public.profiles, public.products, public.product_medias,
  public.collections, public.medias, public.address, public.carts, public.wishlist, public.comments
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.orders, public.order_lines, public.profiles, public.products, public.product_medias,
  public.collections, public.medias
FROM authenticated;

REVOKE TRUNCATE ON public.address, public.carts, public.wishlist, public.comments FROM authenticated;

-- anon has no business reading private tables even if a policy is added by mistake later
REVOKE SELECT ON public.orders, public.order_lines, public.profiles, public.address FROM anon;

GRANT UPDATE (name, phone) ON public.profiles TO authenticated;
