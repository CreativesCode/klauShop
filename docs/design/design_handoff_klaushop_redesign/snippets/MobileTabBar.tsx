// src/components/layouts/MobileTabBar.tsx — tienda, visible < md
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDE_ON = [/^\/cart/, /^\/shop\/[^/]+$/]; // carrito y ficha (tienen su propia barra)

export function MobileTabBar({
  onOpenCategories,
}: {
  onOpenCategories?: () => void;
}) {
  const pathname = usePathname();
  if (HIDE_ON.some((r) => r.test(pathname))) return null;

  const items = [
    { label: "Inicio", href: "/", icon: House, active: pathname === "/" },
    {
      label: "Categorías",
      icon: LayoutGrid,
      onClick: onOpenCategories,
      active: pathname.startsWith("/collections"),
    },
    {
      label: "Favoritos",
      href: "/wish-list",
      icon: Heart,
      active: pathname.startsWith("/wish-list"),
    },
    {
      label: "Cuenta",
      href: "/setting",
      icon: User,
      active: pathname.startsWith("/setting"),
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-line-header bg-white/95 px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-[14px] md:hidden"
    >
      {items.map(({ label, href, icon: Icon, onClick, active }) => {
        const cls = cn(
          "flex h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-bold",
          active ? "text-primary" : "text-neutral-500",
        );
        const inner = (
          <>
            <Icon className="size-[22px]" aria-hidden />
            {label}
          </>
        );
        return href ? (
          <Link
            key={label}
            href={href}
            className={cls}
            aria-current={active ? "page" : undefined}
          >
            {inner}
          </Link>
        ) : (
          <button key={label} type="button" onClick={onClick} className={cls}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
