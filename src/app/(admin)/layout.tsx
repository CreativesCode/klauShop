import { signInRedirect } from "@/lib/safeRedirect";
import { getCurrentUser } from "@/features/users/actions";
import { isAdmin } from "@/features/users/utils";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type Props = { children: ReactNode };

async function AdminLayout({ children }: Props) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect(signInRedirect("/admin"));
  if (!isAdmin(currentUser)) redirect("/");

  // The admin shell (sidebar, top bar, tab bar) lives in admin/layout.tsx
  return <>{children}</>;
}

export default AdminLayout;
