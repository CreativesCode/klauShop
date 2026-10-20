"use client";

import { dashboardConfig } from "@/config/dashboard";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icons } from "../layouts/icons";

const COLLAPSED_KEY = "admin-sidebar-collapsed";

export function isAdminNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  /** pending_confirmation orders, shown on "Órdenes" */
  pendingCount?: number;
  className?: string;
};

/** Admin sidebar (≥ lg): grouped items, active by prefix, collapsible. */
export function SidebarNav({ pendingCount = 0, className }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Storage blocked: keep it expanded
    }
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      } catch {
        // Storage blocked: the choice only lasts this visit
      }
      return !c;
    });
  };

  const itemClass = (active: boolean) =>
    cn(
      "relative flex h-10 items-center gap-3 rounded-[10px] px-2.5 text-sm font-semibold transition-colors",
      active
        ? "bg-primary-50 text-primary-700"
        : "text-neutral-700 hover:bg-primary-50",
      collapsed && "justify-center px-0",
    );

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 flex-col border-r border-line bg-white px-3 py-4 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[248px]",
        className,
      )}
    >
      <Link
        href="/admin/dashboard"
        className={cn(
          "mb-3 flex h-12 items-center gap-2.5 px-1.5",
          collapsed && "justify-center px-0",
        )}
      >
        <Image src="/isotipo.svg" alt="" width={34} height={34} />
        {!collapsed && (
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-extrabold text-ink">
              Klau&apos;s Shop
            </span>
            <span className="text-xs font-semibold text-neutral-500">
              Administración
            </span>
          </span>
        )}
      </Link>

      <nav
        aria-label="Administración"
        className="flex flex-1 flex-col gap-[18px] overflow-y-auto"
      >
        {dashboardConfig.sidebarGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-neutral-500">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = Icons[item.icon ?? "chevronLeft"];
              const active = isAdminNavActive(pathname, item.href!);
              const count =
                item.href === "/admin/orders" ? pendingCount : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  title={collapsed ? item.title : undefined}
                  aria-current={active ? "page" : undefined}
                  className={itemClass(active)}
                >
                  <Icon className="size-[19px] shrink-0" aria-hidden />
                  {!collapsed && <span className="flex-1">{item.title}</span>}
                  {!!count && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-extrabold tabular-nums text-ink",
                        collapsed && "absolute right-1 top-0.5",
                      )}
                      aria-label={`${count} por confirmar`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-3 flex flex-col gap-0.5 border-t border-line pt-3">
        <Link
          href="/"
          title={collapsed ? "Ver tienda" : undefined}
          className={itemClass(false)}
        >
          <Icons.storefront className="size-[19px] shrink-0" aria-hidden />
          {!collapsed && "Ver tienda"}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          className={itemClass(false)}
        >
          {collapsed ? (
            <Icons.panelLeftOpen className="size-[19px] shrink-0" aria-hidden />
          ) : (
            <Icons.panelLeftClose
              className="size-[19px] shrink-0"
              aria-hidden
            />
          )}
          {!collapsed && "Contraer menú"}
        </button>
      </div>
    </aside>
  );
}
