"use client";

import { deleteOrderAction } from "@/_actions/orders";
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
import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatOrderNumber } from "../../utils/whatsapp";

type DeleteOrderDialogProps = {
  orderId: string;
  variant?: "dropdown" | "button" | "text";
};

export function DeleteOrderDialog({
  orderId,
  variant = "button",
}: DeleteOrderDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const orderNumber = formatOrderNumber(orderId);

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await deleteOrderAction(orderId);
        // Cerrar el diálogo antes de redirigir
        setOpen(false);
        toast({
          title: "Orden eliminada",
          description: `La orden "${orderNumber}" ha sido eliminada correctamente.`,
        });
        router.push("/admin/orders");
        router.refresh();
      } catch (error: any) {
        console.error("Error deleting order:", error);
        const errorMessage =
          error?.message ||
          "Ocurrió un error al eliminar la orden. Por favor, inténtalo de nuevo.";
        toast({
          title: "No se puede eliminar la orden",
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
            Eliminar Orden
          </DropdownMenuItem>
        ) : variant === "text" ? (
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-extrabold text-red-700 transition-colors hover:bg-red-50"
          >
            <Icons.trash2 className="size-4" aria-hidden />
            Eliminar orden
          </button>
        ) : (
          <Button variant="destructive">Eliminar Orden</Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de eliminar esta orden?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la
            orden &quot;{orderNumber}&quot; y todos sus datos relacionados.
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
