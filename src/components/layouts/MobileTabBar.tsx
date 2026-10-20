"use client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSideMenu } from "./SideMenu";
import { Icons } from "./icons";

// The cart and the product page have their own fixed bottom bar
export const TAB_BAR_HIDDEN_ON = [/^\/cart/, /^\/shop\/[^/]+$/];

export function hasMobileTabBar(pathname: string) {
  return !TAB_BAR_HIDDEN_ON.some((r) => r.test(pathname));
}

/** Store bottom navigation, visible below md. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const openCategories = useSideMenu((s) => s.setOpen);
  if (!hasMobileTabBar(pathname)) return null;

  const items = [
    {
      label: "Inicio",
      href: "/",
      icon: Icons.house,
      active: pathname === "/",
    },
    {
      label: "Categorías",
      icon: Icons.layoutGrid,
      onClick: () => openCategories(true),
      active:
        pathname.startsWith("/collections") || pathname.startsWith("/shop"),
    },
    {
      label: "Favoritos",
      href: "/wish-list",
      icon: Icons.heart,
      active: pathname.startsWith("/wish-list"),
    },
    {
      label: "Cuenta",
      href: user ? "/setting" : "/sign-in",
      icon: Icons.user,
      active: pathname.startsWith("/setting") || pathname.startsWith("/orders"),
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line-header bg-white/95 px-2 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-[14px] md:hidden"
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

export default MobileTabBar;
