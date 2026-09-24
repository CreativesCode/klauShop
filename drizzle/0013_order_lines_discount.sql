-- Store the list price and discount % applied on each order line.
-- "price" keeps being the final unit price charged.
ALTER TABLE "order_lines" ADD COLUMN IF NOT EXISTS "list_price" numeric(8, 2);
ALTER TABLE "order_lines" ADD COLUMN IF NOT EXISTS "discount" numeric(5, 2) DEFAULT '0.00' NOT NULL;

-- Existing orders were charged the list price (no discount applied server-side)
UPDATE "order_lines" SET "list_price" = "price" WHERE "list_price" IS NULL;
