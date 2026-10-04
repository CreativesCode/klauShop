-- 0023: accent-insensitive product search (pilot QA P1-15): "lapices" finds "Lápices".
-- Manual migration (outside the drizzle-kit journal). Additive: apply BEFORE deploying the code
-- that filters by search_name (pg_graphql must expose the column), then `npm run codegen:fetch`.
-- search_name is not in src/lib/supabase/schema.ts on purpose: Drizzle never writes it.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- unaccent() is STABLE (depends on the dictionary); a generated column needs IMMUTABLE.
-- Pinning the dictionary makes the wrapper safe to mark IMMUTABLE.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(p_text text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
SET search_path = '' AS $$
  SELECT extensions.unaccent('extensions.unaccent'::regdictionary, p_text);
$$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_name text
  GENERATED ALWAYS AS (lower(public.immutable_unaccent(name))) STORED;
