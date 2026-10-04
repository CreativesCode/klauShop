-- 0020: create public.profiles for every auth user (pilot QA P0-04).
-- Manual migration (outside the drizzle-kit journal). Additive: safe to apply before or after deploy.
-- orders.user_id and address.userProfileId reference profiles, and nothing created them, so new
-- customers got a FK error (500) when saving an address or ordering while logged in.
-- is_admin is never copied from user input: admin = JWT app_metadata.isAdmin (see 0018).

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a sign-up; the app also creates the profile on demand (ensureProfile)
  RAISE WARNING 'handle_new_user_profile failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill existing users without a profile
INSERT INTO public.profiles (id, email, name)
SELECT u.id, u.email, u.raw_user_meta_data ->> 'name'
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
 WHERE p.id IS NULL
ON CONFLICT DO NOTHING;
