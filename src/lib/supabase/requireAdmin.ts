import "server-only";

import createServerClient from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Guard for server actions and other server code that only admins may run.
// Server actions are public POST endpoints: every admin action must call this first.
export async function requireAdmin() {
  const supabase = createServerClient({ cookieStore: cookies() });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.isAdmin !== true) {
    throw new Error("No autorizado.");
  }

  return user;
}
