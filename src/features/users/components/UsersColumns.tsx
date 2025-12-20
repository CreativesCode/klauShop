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
          className="font-medium hover:underline"
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
      return <p className="text-truncate sm:text-nowrap">{user.email}</p>;
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
      const displayRole = isAdmin ? "Admin" : "Usuario";

      return (
        <Badge
          variant="outline"
          className={cn(
            "rounded-md px-2 py-1 font-medium flex items-center gap-1.5 w-fit",
            isAdmin
              ? "text-blue-600 border-blue-600 bg-blue-50"
              : "text-gray-600 border-gray-300",
          )}
        >
          {isAdmin ? (
            <Shield className="h-3 w-3" />
          ) : (
            <UserIcon className="h-3 w-3" />
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
    header: () => <div className="text-center capitalize">Acc</div>,
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
            title: !res.ok ? "Error" : "Success",
            description: message,
          });

          router.refresh();
        } catch (err) {
          toast({
            title: "Error",
            description: "Unexpected Error occured.",
          });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="flex flex-col items-start"
          >
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>

            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`}>Editar Usuario</Link>
            </DropdownMenuItem>
            <Button onClick={() => promoteAdminHandler(user.id)}>
              Promover a Admin
            </Button>
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
