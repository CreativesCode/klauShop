import { getProfilePhone } from "@/features/users";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountClient } from "./AccountClient";

export default async function AccountPage() {
  const cookieStore = cookies();
  const supabase = createClient({ cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const isAdmin = Boolean(user.app_metadata?.isAdmin);
  const adminPhone = isAdmin ? await getProfilePhone(user.id) : "";

  return <AccountClient isAdmin={isAdmin} adminPhone={adminPhone} />;
}
