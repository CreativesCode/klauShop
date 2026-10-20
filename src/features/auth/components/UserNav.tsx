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
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ?? "";
  const displayName =
    (user?.user_metadata?.name as string | undefined) ?? "User";

  const logout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-label="Mi cuenta"
              className="relative flex h-11 items-center gap-2 rounded-full px-1.5 sm:pr-3"
            >
              <Avatar className="size-8 border-0">
                {/* TODO: UPDATE AVATOR IMAGE & NAME */}
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={getNameInitials(displayName)}
                />
                <AvatarFallback className="bg-primary-100 text-xs font-extrabold text-primary-700">
                  {getNameInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm font-bold text-ink sm:inline-block">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {displayName}
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
                <DropdownMenuItem>Favoritos</DropdownMenuItem>
              </Link>
              <Link href="/cart">
                <DropdownMenuItem>Carrito</DropdownMenuItem>
              </Link>
              <Link href="/setting">
                <DropdownMenuItem>Configuraciones</DropdownMenuItem>
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
              Cerrar sesión
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link
          href="/sign-in"
          prefetch={false}
          className="flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-bold text-ink transition-colors hover:bg-surface-muted"
        >
          <Icons.user className="size-5" aria-hidden />
          Entrar
        </Link>
      )}
    </>
  );
}

export default UserNav;
