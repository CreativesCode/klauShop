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
import { useState } from "react";
import Branding from "./Branding";
import type { Collection } from "./SideMenuCollections";
import SideMenuCollections from "./SideMenuCollections";
import { Icons } from "./icons";

interface SideMenuProps {
  collections: Collection[];
}

export function SideMenu({ collections }: SideMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.isAdmin ?? false;
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="p-0 hover:bg-primary-100/50">
          <Icons.menu className="text-primary w-6 h-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="!w-full max-w-[100vw] md:!max-w-md pr-4 md:pr-8 overflow-y-auto"
        closeButtonClassName="w-5 h-5 md:w-6 md:h-6"
      >
        <div className="flex flex-col h-full">
          {/* Header con Branding */}
          <div className="pt-8 pb-6 border-b border-primary-200">
            <Branding className="text-2xl md:text-3xl mb-2" />
            <p className="text-xs md:text-sm text-muted-foreground">
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
                "flex items-center gap-3 px-4 py-3 rounded-lg text-base md:text-lg font-medium transition-colors",
                pathname === "/shop"
                  ? "bg-primary-100 text-primary font-semibold"
                  : "hover:bg-primary-50 text-foreground",
              )}
            >
              <Icons.store className="w-5 h-5" />
              <span>Ver todos los productos</span>
            </Link>

            {/* Árbol de Colecciones */}
            <div className="mt-4">
              <div className="px-4 mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Colecciones
                </h3>
              </div>
              <SideMenuCollections
                collections={collections}
                onLinkClick={() => setOpen(false)}
              />
            </div>

            {/* Sección de Administración - Solo para admins */}
            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-primary-200">
                <div className="px-4 mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Administración
                  </h3>
                </div>
                <div className="space-y-1">
                  {dashboardConfig.sidebarNav.map((item) => {
                    const Icon = Icons[item.icon ?? "chevronLeft"];
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-base md:text-lg font-medium transition-colors",
                          isActive
                            ? "bg-primary-100 text-primary font-semibold"
                            : "hover:bg-primary-50 text-foreground",
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
          <SheetFooter className="flex-col items-start gap-4 pt-6 border-t border-primary-200 mt-auto">
            <div className="text-sm text-primary-800">
              <p className="text-center">
                &copy; {new Date().getFullYear()} {siteConfig.name} by
                CreativeCode. All rights reserved.
              </p>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
