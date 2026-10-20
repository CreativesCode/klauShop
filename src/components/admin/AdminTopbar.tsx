"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import supabaseClient from "@/lib/supabase/client";
import { getNameInitials } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icons } from "../layouts/icons";

type Props = {
  name: string;
  email?: string | null;
  pendingCount?: number;
};

/** Sticky admin top bar: order search, pending-orders bell and account menu. */
export function AdminTopbar({ name, email, pendingCount = 0 }: Props) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const logout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-surface-admin/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-admin items-center gap-3 px-4 py-3 lg:px-8">
        <Link href="/admin/dashboard" className="shrink-0 lg:hidden">
          <Image src="/isotipo.svg" alt="Klau's Shop" width={32} height={32} />
        </Link>

        <form
          role="search"
          className="flex h-[42px] min-w-0 max-w-[440px] flex-1 items-center gap-2.5 rounded-xl border border-[#E7E4EF] bg-white px-3.5 focus-within:border-primary-300"
          onSubmit={(e) => {
            e.preventDefault();
            const q = searchRef.current?.value.trim();
            router.push(
              q
                ? `/admin/orders?search=${encodeURIComponent(q)}`
                : "/admin/orders",
            );
          }}
        >
          <Icons.search
            className="size-[18px] shrink-0 text-neutral-500"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            enterKeyHint="search"
            aria-label="Buscar órdenes"
            placeholder="Buscar órdenes, clientes, teléfonos…"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-neutral-500 md:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 text-[11px] font-bold text-neutral-500 lg:inline">
            ⌘K
          </kbd>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin/orders?status=pending"
            aria-label={
              pendingCount > 0
                ? `${pendingCount} órdenes por confirmar`
                : "Órdenes pendientes"
            }
            className="relative flex size-[42px] items-center justify-center rounded-xl border border-[#E7E4EF] bg-white text-ink transition-colors hover:bg-primary-50"
          >
            <Icons.bell className="size-5" aria-hidden />
            {pendingCount > 0 && (
              <span
                className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-white"
                aria-hidden
              />
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Mi cuenta"
              className="flex size-[42px] items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white outline-none focus-visible:ring-4 focus-visible:ring-primary-100"
            >
              {getNameInitials(name) || "A"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-bold leading-tight">{name}</p>
                {email && (
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {email}
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">Ver tienda</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/setting">Mi cuenta</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-700">
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
