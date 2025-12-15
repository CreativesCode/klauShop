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
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderActionsButtonsProps = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
};

export default function OrderActionsButtons({
  orderId,
  orderStatus,
  paymentStatus,
}: OrderActionsButtonsProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al marcar como pagada");
      }

      toast({
        title: "Orden marcada como pagada",
        description: "El stock ha sido descontado correctamente",
      });

      router.refresh();
    } catch (error: any) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar la orden como pagada",
        variant: "destructive",
      });
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cancelar orden");
      }

      toast({
        title: "Orden cancelada",
        description: "Las reservas han sido liberadas",
      });

      router.refresh();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la orden",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canMarkAsPaid = paymentStatus !== "paid" && orderStatus !== "cancelled";

  const canCancel =
    orderStatus !== "cancelled" &&
    orderStatus !== "delivered" &&
    orderStatus !== "shipped";

  return (
    <div className="space-y-2">
      {/* Marcar como pagada */}
      {canMarkAsPaid && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              variant="default"
              disabled={isMarkingPaid}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isMarkingPaid ? "Procesando..." : "Marcar como Pagada"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar pago recibido?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción marcará la orden como pagada y descontará el stock
                de los productos. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleMarkAsPaid}>
                Confirmar Pago
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancelar orden */}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full"
              variant="destructive"
              disabled={isCancelling}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isCancelling ? "Cancelando..." : "Cancelar Orden"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar esta orden?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción liberará las reservas de stock. Si la orden ya fue
                pagada, no podrás cancelarla desde aquí.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, Cancelar Orden
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Estado actual */}
      {!canMarkAsPaid && !canCancel && (
        <div className="text-sm text-muted-foreground text-center py-2">
          No hay acciones disponibles para esta orden
        </div>
      )}
    </div>
  );
}
