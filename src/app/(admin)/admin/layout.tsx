import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { signInRedirect } from "@/lib/safeRedirect";
import createServerClient, { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Orders waiting for the admin's confirmation (sidebar / tab bar counters)
async function getPendingConfirmationCount(
  cookieStore: ReturnType<typeof cookies>,
) {
  try {
    const { count } = await createClient({ cookieStore, isAdmin: true })
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_status", "pending_confirmation");
    return count ?? 0;
  } catch (error) {
    console.error("Pending orders count failed:", error);
    return 0;
  }
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(signInRedirect("/admin"));
  }

  // Verificar que el usuario sea admin usando app_metadata
  if (!user.app_metadata?.isAdmin) {
    redirect("/");
  }

  const pendingCount = await getPendingConfirmationCount(cookieStore);
  const name =
    (user.user_metadata?.name as string | undefined) || user.email || "Admin";

  return (
    <div className="flex min-h-screen bg-surface-admin">
      <SidebarNav pendingCount={pendingCount} className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
        <AdminTopbar
          name={name}
          email={user.email}
          pendingCount={pendingCount}
        />
        <main className="mx-auto flex w-full max-w-admin flex-col gap-4 px-4 py-5 lg:gap-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <AdminTabBar pendingCount={pendingCount} className="lg:hidden" />
    </div>
  );
}
