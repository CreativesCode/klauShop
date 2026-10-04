import { signInRedirect } from "@/lib/safeRedirect";
import { getCurrentUser } from "@/features/users/actions";
import { isAdmin } from "@/features/users/utils";
import MainFooter from "@/components/layouts/MainFooter";
import Navbar from "@/components/layouts/MainNavbar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type Props = { children: ReactNode };

async function AdminLayout({ children }: Props) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect(signInRedirect("/admin"));
  if (!isAdmin(currentUser)) redirect("/");

  return (
    <main>
      {/* Denser admin UI: every Tailwind rem size scales down (store keeps 16px) */}
      <style>{`html { font-size: 14px; }`}</style>
      <Navbar adminLayout={true} />
      {children}
      <MainFooter />
    </main>
  );
}

export default AdminLayout;
