"use client";

import { deleteProductAction } from "@/_actions/products";
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

type DeleteProductDialogProps = {
  productId: string;
  productName: string;
  variant?: "dropdown" | "button";
};

export function DeleteProductDialog({
  productId,
  productName,
  variant = "button",
}: DeleteProductDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await deleteProductAction(productId);
        // Cerrar el diálogo antes de redirigir
        setOpen(false);
        toast({
          title: "Producto eliminado",
          description: `El producto "${productName}" ha sido eliminado correctamente.`,
        });
        router.push("/admin/products");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting product:", error);
        const errorMessage =
          error?.message ||
          "Ocurrió un error al eliminar el producto. Por favor, inténtalo de nuevo.";
        toast({
          title: "No se puede eliminar el producto",
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
            Eliminar Producto
          </DropdownMenuItem>
        ) : (
          <Button variant="destructive">Eliminar</Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de eliminar este producto?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el
            producto &quot;{productName}&quot; y todos sus datos relacionados.
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
