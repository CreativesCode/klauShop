-- 0021: idempotent checkout (pilot QA P0-06).
-- Manual migration (outside the drizzle-kit journal). Additive and nullable: apply BEFORE deploying
-- code whose Drizzle schema includes orders.client_request_id (Drizzle selects/inserts every column).
-- The checkout sends one id per attempt and reuses it on retries, so a lost response + retry
-- returns the same order instead of creating a duplicate with double reservations.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_request_id text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_client_request_id_key
  ON public.orders (client_request_id);
