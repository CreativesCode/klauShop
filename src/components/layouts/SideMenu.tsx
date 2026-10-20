"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dashboardConfig } from "@/config/dashboard";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import Branding from "./Branding";
import type { Collection } from "./SideMenuCollections";
import SideMenuCollections from "./SideMenuCollections";
import { Icons } from "./icons";

// Shared so the mobile tab bar ("Categorías") can open the menu
export const useSideMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

interface SideMenuProps {
  collections: Collection[];
}

export function SideMenu({ collections }: SideMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.isAdmin ?? false;
  const { open, setOpen } = useSideMenu();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menú">
          <Icons.menu className="size-6 text-ink" aria-hidden />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="!w-full max-w-[100vw] overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] md:!max-w-md md:px-6"
      >
        <div className="flex flex-col h-full">
          {/* Header con Branding */}
          <div className="border-b border-line pb-5 pt-2">
            <Branding className="mb-2" />
            <p className="text-[13px] text-neutral-500">
              {siteConfig.description}
            </p>
          </div>

          {/* Navegación Principal */}
          <div className="flex-1 py-6 space-y-1">
            {/* Link a Shop */}
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className={cn(
                "flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-bold transition-colors",
                pathname === "/shop"
                  ? "bg-primary-50 text-primary-700"
                  : "text-ink hover:bg-primary-50",
              )}
            >
              <Icons.store className="w-5 h-5" />
              <span>Ver todos los productos</span>
            </Link>

            {/* Árbol de Colecciones */}
            <div className="mt-4">
              <div className="px-4 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-[.08em] text-neutral-500">
                  Categorías
                </h3>
              </div>
              <SideMenuCollections
                collections={collections}
                onLinkClick={() => setOpen(false)}
              />
            </div>

            {/* Sección de Administración - Solo para admins */}
            {isAdmin && (
              <div className="mt-6 border-t border-line pt-6">
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-[.08em] text-neutral-500">
                    Administración
                  </h3>
                </div>
                <div className="space-y-1">
                  {dashboardConfig.sidebarNav.map((item) => {
                    const Icon = Icons[item.icon ?? "chevronLeft"];
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-primary-50 text-primary-700"
                            : "text-neutral-700 hover:bg-primary-50",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer con información de contacto */}
          <SheetFooter className="mt-auto flex-col items-start gap-4 border-t border-line pt-5">
            <div className="text-[13px] text-neutral-500">
              <p className="text-center">
                &copy; {new Date().getFullYear()} {siteConfig.name}. Todos los
                derechos reservados.
              </p>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
