"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import supabaseClient from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icons } from "../layouts/icons";
import { isAdminNavActive } from "./SidebarNav";

const tabs = [
  { label: "Inicio", href: "/admin/dashboard", icon: Icons.layoutDashboard },
  { label: "Órdenes", href: "/admin/orders", icon: Icons.receipt },
  { label: "Productos", href: "/admin/products", icon: Icons.cart },
  { label: "Clientes", href: "/admin/users", icon: Icons.user },
];

const more = [
  { label: "Colecciones", href: "/admin/collections", icon: Icons.folder },
  { label: "Multimedia", href: "/admin/medias", icon: Icons.image },
  { label: "Zonas de envío", href: "/admin/shipping-zones", icon: Icons.truck },
  { label: "Ver tienda", href: "/", icon: Icons.storefront },
];

const item =
  "relative flex h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-bold";

/** Admin bottom navigation, visible below lg (the sidebar takes over above). */
export function AdminTabBar({
  pendingCount = 0,
  className,
}: {
  pendingCount?: number;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const moreActive = more.some(
    (m) => m.href !== "/" && isAdminNavActive(pathname, m.href),
  );

  const logout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      aria-label="Navegación del admin"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 px-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-[14px]",
        className,
      )}
    >
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = isAdminNavActive(pathname, href);
        const count = href === "/admin/orders" ? pendingCount : 0;
        return (
          <Link
            key={href}
            href={href}
            className={cn(item, active ? "text-primary" : "text-neutral-500")}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-[22px]" aria-hidden />
            {label}
            {count > 0 && (
              <span
                className="absolute left-[calc(50%+6px)] top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[5px] text-[11px] font-extrabold tabular-nums text-ink"
                aria-label={`${count} por confirmar`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(item, moreActive ? "text-primary" : "text-neutral-500")}
        >
          <Icons.menu className="size-[22px]" aria-hidden />
          Más
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-[24px] px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5"
        >
          <SheetTitle className="mb-3 px-3 text-[15px]">
            Más secciones
          </SheetTitle>
          <div className="flex flex-col">
            {more.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold hover:bg-primary-50",
                  href !== "/" && isAdminNavActive(pathname, href)
                    ? "bg-primary-50 text-primary-700"
                    : "text-ink",
                )}
              >
                <Icon className="size-5 text-neutral-500" aria-hidden />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={logout}
              className="mt-2 flex h-12 items-center gap-3 rounded-xl border-t border-line px-3 text-[15px] font-semibold text-red-700 hover:bg-red-50"
            >
              <Icons.close className="size-5" aria-hidden />
              Cerrar sesión
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
