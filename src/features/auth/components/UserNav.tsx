"use client";

import { Icons } from "@/components/layouts/icons";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import supabaseClient from "@/lib/supabase/client";
import { getNameInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

function UserNav() {
  const router = useRouter();
  const { user } = useAuth();

  const logout = () => {
    supabaseClient.auth.signOut();
    router.refresh();
  };

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-auto px-2 py-1.5 rounded-full focus:ring-0 border-0 flex items-center gap-2"
            >
              <Avatar className="h-8 w-8 focus:ring-0 border-0">
                {/* TODO: UPDATE AVATOR IMAGE & NAME */}
                <AvatarImage
                  src="/avatars/01.png"
                  alt={getNameInitials(
                    (user.user_metadata.name as string) ?? "Name",
                  )}
                />
                <AvatarFallback className="text-accent border border-primary bg-primary-200">
                  {getNameInitials(
                    (user.user_metadata.name as string) ?? "Name",
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block text-primary">
                {user.user_metadata.name || "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.user_metadata.name || "username"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/orders">
                <DropdownMenuItem>Órdenes</DropdownMenuItem>
              </Link>
              <Link href="/wish-list">
                <DropdownMenuItem>Lista de Deseos</DropdownMenuItem>
              </Link>
              <Link href="/cart">
                <DropdownMenuItem>Carrito</DropdownMenuItem>
              </Link>
              <Link href="/setting">
                <DropdownMenuItem>Configuración</DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            {user.app_metadata.isAdmin && (
              <>
                <DropdownMenuGroup>
                  <Link href="/admin">
                    <DropdownMenuItem>
                      Administración
                      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={logout}>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link href="/sign-in" className="flex items-center text-foreground">
          <Icons.user className="h-5 w-5 mr-2 text-primary" />
          <p className="text-sm text-primary hidden sm:inline-block">Sign in</p>
        </Link>
      )}
    </>
  );
}

export default UserNav;
