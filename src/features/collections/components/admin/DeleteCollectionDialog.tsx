"use client";

import { deleteCollectionAction } from "@/_actions/collections";
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
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DeleteCollectionDialogProps = {
  collectionId: string;
  collectionName: string;
  variant?: "dropdown" | "button";
};

export function DeleteCollectionDialog({
  collectionId,
  collectionName,
  variant = "button",
}: DeleteCollectionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await deleteCollectionAction(collectionId);
        // Cerrar el diálogo antes de redirigir
        setOpen(false);
        toast({
          title: "Colección eliminada",
          description: `La colección "${collectionName}" ha sido eliminada correctamente.`,
        });
        router.push("/admin/collections");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting collection:", error);
        const errorMessage =
          error?.message ||
          "Ocurrió un error al eliminar la colección. Por favor, inténtalo de nuevo.";
        toast({
          title: "No se puede eliminar la colección",
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
            Eliminar Colección
          </DropdownMenuItem>
        ) : (
          <Button variant="destructive">Eliminar</Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de eliminar esta colección?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la
            colección &quot;{collectionName}&quot; y todos sus datos
            relacionados. Los productos asociados perderán su referencia a esta
            colección.
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
