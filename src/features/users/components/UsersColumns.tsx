"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Shield, User as UserIcon } from "lucide-react";
import Link from "next/link";

import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { DeleteUserDialog } from "./admin/DeleteUserDialog";

const UsersColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nombre" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const name = user.user_metadata?.name || "-";
      return (
        <Link
          href={`/admin/users/${user.id}`}
          className="font-bold text-ink hover:text-primary-700"
        >
          {name}
        </Link>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return <p className="truncate text-neutral-600">{user.email}</p>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rol" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const isAdmin = user.app_metadata?.isAdmin === true;
      const displayRole = isAdmin ? "Admin" : "Cliente";

      return (
        <Badge
          variant="secondary"
          className={cn(
            "w-fit gap-1.5",
            isAdmin && "bg-primary-50 text-primary-700",
          )}
        >
          {isAdmin ? (
            <Shield className="size-3" aria-hidden />
          ) : (
            <UserIcon className="size-3" aria-hidden />
          )}
          {displayRole}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const user = row.original;
      const isAdmin = user.app_metadata?.isAdmin === true;
      if (value === "all") return true;
      if (value === "admin") return isAdmin;
      if (value === "user") return !isAdmin;
      return true;
    },
  },

  {
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => {
      const user = row.original;
      const { toast } = useToast();
      const router = useRouter();

      const promoteAdminHandler = async (userId: string) => {
        try {
          const res = await fetch("/api/users/promote-user", {
            method: "POST",
            body: JSON.stringify({
              userId,
            }),
          });

          const { message } = await res.json();
          toast({
            title: !res.ok ? "Error" : "Listo",
            description: message,
          });

          router.refresh();
        } catch (err) {
          toast({
            title: "Error",
            description: "Ocurrió un error inesperado.",
          });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconAdmin">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>

            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`}>Editar usuario</Link>
            </DropdownMenuItem>
            {user.app_metadata?.isAdmin !== true && (
              <DropdownMenuItem onSelect={() => promoteAdminHandler(user.id)}>
                Hacer administrador
              </DropdownMenuItem>
            )}
            <DeleteUserDialog
              userId={user.id}
              userName={user.user_metadata?.name || user.email || "Usuario"}
              variant="dropdown"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default UsersColumns;
