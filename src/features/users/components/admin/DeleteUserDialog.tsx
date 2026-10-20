"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { deleteUserAction } from "@/features/users/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteUserDialogProps = {
  userId: string;
  userName: string;
  variant?: "dropdown" | "button";
};

export function DeleteUserDialog({
  userId,
  userName,
  variant = "button",
}: DeleteUserDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await deleteUserAction(userId);
        // Cerrar el diálogo antes de redirigir
        setOpen(false);
        toast({
          title: "Usuario eliminado",
          description: `El usuario "${userName}" ha sido eliminado correctamente.`,
        });
        router.push("/admin/users");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        const errorMessage =
          error?.message ||
          "Ocurrió un error al eliminar el usuario. Por favor, inténtalo de nuevo.";
        toast({
          title: "No se puede eliminar el usuario",
          description: errorMessage,
          variant: "destructive",
        });
        // Si hay error, no cerramos el diálogo para que el usuario pueda leer el mensaje
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === "dropdown" ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            Eliminar Usuario
          </DropdownMenuItem>
        ) : (
          <Button variant="destructiveSoft">Eliminar usuario</Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de eliminar este usuario?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el
            usuario &quot;{userName}&quot; y todos sus datos relacionados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
