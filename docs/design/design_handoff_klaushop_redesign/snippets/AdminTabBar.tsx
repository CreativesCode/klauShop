// src/components/admin/AdminTabBar.tsx — admin, visible < lg
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  Receipt,
  ShoppingCart,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AdminTabBar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const tabs = [
    { label: "Inicio", href: "/admin/dashboard", icon: LayoutDashboard },
    {
      label: "Órdenes",
      href: "/admin/orders",
      icon: Receipt,
      count: pendingCount,
    },
    { label: "Productos", href: "/admin/products", icon: ShoppingCart },
    { label: "Clientes", href: "/admin/users", icon: User },
  ];
  const more = [
    { label: "Colecciones", href: "/admin/collections" },
    { label: "Multimedia", href: "/admin/medias" },
    { label: "Zonas de envío", href: "/admin/shipping-zones" },
    { label: "Ver tienda", href: "/" },
  ];
  const item =
    "relative flex h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-bold";

  return (
    <nav
      aria-label="Navegación del admin"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 px-1.5 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-[14px] lg:hidden"
    >
      {tabs.map(({ label, href, icon: Icon, count }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(item, active ? "text-primary" : "text-neutral-500")}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-[22px]" aria-hidden />
            {label}
            {!!count && (
              <span className="absolute left-[calc(50%+6px)] top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-[5px] text-[10px] font-extrabold text-ink">
                {count}
              </span>
            )}
          </Link>
        );
      })}
      <Sheet>
        <SheetTrigger className={cn(item, "text-neutral-500")}>
          <Menu className="size-[22px]" aria-hidden />
          Más
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-[24px] pb-[calc(24px+env(safe-area-inset-bottom))]"
        >
          <div className="flex flex-col">
            {more.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="flex h-12 items-center rounded-xl px-3 text-[15px] font-semibold hover:bg-primary-50"
              >
                {m.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
