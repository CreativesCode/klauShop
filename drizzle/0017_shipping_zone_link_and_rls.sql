-- ============================================================
-- 1) Link orders and addresses to shipping_zones by id.
--    `zone` (name) stays as a snapshot; `shipping_zone_id` survives renames.
--    NULL = zone not registered ("Otro"), shipping cost to be defined by admin.
-- 2) Close shipping_zones and inventory_reservations to anon/authenticated.
--    They had RLS disabled and full grants: anyone with the public anon key
--    could change shipping costs or delete reservations via PostgREST.
--    The app writes both through Drizzle (postgres role), which bypasses RLS.
-- ============================================================

ALTER TABLE "orders"  ADD COLUMN IF NOT EXISTS "shipping_zone_id" text
  REFERENCES "shipping_zones"("id") ON DELETE SET NULL;
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "shipping_zone_id" text
  REFERENCES "shipping_zones"("id") ON DELETE SET NULL;

-- Backfill where the stored name matches a zone exactly (case/space-insensitive)
UPDATE "orders" o
   SET "shipping_zone_id" = z."id"
  FROM "shipping_zones" z
 WHERE o."shipping_zone_id" IS NULL
   AND lower(btrim(o."zone")) = lower(btrim(z."name"));

UPDATE "address" a
   SET "shipping_zone_id" = z."id"
  FROM "shipping_zones" z
 WHERE a."shipping_zone_id" IS NULL
   AND lower(btrim(a."zone")) = lower(btrim(z."name"));

-- ------------------------------------------------------------
-- shipping_zones: public read (checkout), no client writes
-- ------------------------------------------------------------
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.shipping_zones FROM anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read shipping zones" ON public.shipping_zones;
CREATE POLICY "Anyone can read shipping zones"
  ON public.shipping_zones FOR SELECT
  USING (true);

-- ------------------------------------------------------------
-- inventory_reservations: a user only reads reservations of their own
-- orders (OrdersList shows variants via pg_graphql); no client writes
-- ------------------------------------------------------------
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.inventory_reservations FROM anon, authenticated;

DROP POLICY IF EXISTS "Users can read reservations of their orders" ON public.inventory_reservations;
CREATE POLICY "Users can read reservations of their orders"
  ON public.inventory_reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.id = inventory_reservations.order_id
         AND o.user_id = auth.uid()
    )
  );
