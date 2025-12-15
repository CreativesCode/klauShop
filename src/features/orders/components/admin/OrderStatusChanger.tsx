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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getOrderStatusInfo,
  getValidNextStatuses,
} from "../../utils/orderStatus";

type OrderStatusChangerProps = {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
};

export default function OrderStatusChanger({
  orderId,
  currentStatus,
  paymentStatus,
}: OrderStatusChangerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(
    null,
  );
  const [isChanging, setIsChanging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "change" | "mark-paid" | "cancel"
  >("change");
  const { toast } = useToast();
  const router = useRouter();

  const validNextStatuses = getValidNextStatuses(currentStatus);

  // Función helper para obtener el color hover más fuerte basado en el bgColor
  const getHoverColor = (bgColor: string): string => {
    const colorMap: Record<string, string> = {
      "bg-yellow-50": "hover:bg-yellow-100",
      "bg-orange-50": "hover:bg-orange-100",
      "bg-green-50": "hover:bg-green-100",
      "bg-blue-50": "hover:bg-blue-100",
      "bg-indigo-50": "hover:bg-indigo-100",
      "bg-emerald-50": "hover:bg-emerald-100",
      "bg-red-50": "hover:bg-red-100",
    };
    return colorMap[bgColor] || "hover:bg-opacity-80";
  };

  // Agregar "paid" a los estados posibles si puede marcarse como pagada
  const canMarkAsPaid =
    paymentStatus !== "paid" &&
    currentStatus !== "cancelled" &&
    (currentStatus === "pending_confirmation" ||
      currentStatus === "pending_payment");

  // Agregar "cancelled" si puede cancelarse
  const canCancel =
    currentStatus !== "cancelled" &&
    currentStatus !== "delivered" &&
    currentStatus !== "shipped";

  // Construir lista de estados disponibles
  const availableStatuses: OrderStatus[] = [...validNextStatuses];
  if (canMarkAsPaid && !availableStatuses.includes("paid")) {
    availableStatuses.push("paid");
  }
  if (canCancel && !availableStatuses.includes("cancelled")) {
    availableStatuses.push("cancelled");
  }

  const currentStatusInfo = getOrderStatusInfo(currentStatus) || {
    label: "Desconocido",
    description: "Estado desconocido",
    icon: () => null,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
  };
  const CurrentIcon = currentStatusInfo.icon;

  const handleStatusChange = async (status: OrderStatus) => {
    setSelectedStatus(status);

    // Determinar qué tipo de acción usar
    if (status === "paid") {
      setActionType("mark-paid");
    } else if (status === "cancelled") {
      setActionType("cancel");
    } else {
      setActionType("change");
    }

    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedStatus) return;

    setIsChanging(true);
    try {
      let response;
      let successMessage = "";

      if (actionType === "mark-paid") {
        // Usar endpoint de mark-paid (descuenta stock y sincroniza payment_status)
        response = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
          method: "POST",
        });
        successMessage =
          "Orden marcada como pagada. El stock ha sido descontado.";
      } else if (actionType === "cancel") {
        // Usar endpoint de cancel (libera reservas)
        response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
          method: "POST",
        });
        successMessage = "Orden cancelada. Las reservas han sido liberadas.";
      } else {
        // Usar endpoint de change-status (solo cambia estado)
        response = await fetch(`/api/admin/orders/${orderId}/change-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newStatus: selectedStatus,
          }),
        });
        successMessage = `La orden ahora está en estado: ${getOrderStatusInfo(selectedStatus)?.label || selectedStatus}`;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cambiar el estado");
      }

      toast({
        title: "Estado actualizado",
        description: successMessage,
      });

      setShowConfirmDialog(false);
      setSelectedStatus(null);
      router.refresh();
    } catch (error: any) {
      console.error("Error changing status:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estado de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado actual */}
          <div>
            <Label className="text-sm text-muted-foreground">
              Estado Actual
            </Label>
            <div
              className={cn(
                "mt-2 flex items-center gap-3 p-3 rounded-lg border",
                currentStatusInfo.borderColor,
                currentStatusInfo.bgColor,
              )}
            >
              <CurrentIcon size={20} className={currentStatusInfo.color} />
              <div>
                <p className={cn("font-medium", currentStatusInfo.color)}>
                  {currentStatusInfo.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentStatusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Botones de estados posibles */}
          {availableStatuses.length > 0 ? (
            <div className="space-y-3">
              <Label>Cambiar a Estado</Label>
              <div className="grid grid-cols-1 gap-2">
                {availableStatuses.map((status) => {
                  const statusInfo = getOrderStatusInfo(status);
                  if (!statusInfo) return null;
                  const Icon = statusInfo.icon;
                  return (
                    <Button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isChanging}
                      variant="outline"
                      className={cn(
                        "w-full justify-start gap-2 h-auto py-3 transition-colors",
                        statusInfo.borderColor,
                        statusInfo.bgColor,
                        getHoverColor(statusInfo.bgColor),
                      )}
                    >
                      <Icon size={18} className={statusInfo.color} />
                      <div className="flex flex-col items-start flex-1">
                        <span className={cn("font-medium", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {statusInfo.description}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              Esta orden está en un estado final y no puede cambiar.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar estado de la orden?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus && (
                <>
                  Estás a punto de cambiar el estado de{" "}
                  <strong>{currentStatusInfo.label}</strong> a{" "}
                  <strong>
                    {getOrderStatusInfo(selectedStatus)?.label ||
                      selectedStatus}
                  </strong>
                  .
                  <br />
                  <br />
                  {actionType === "mark-paid" && (
                    <>
                      Esta acción marcará la orden como pagada y descontará el
                      stock de los productos. Esta acción no se puede deshacer.
                    </>
                  )}
                  {actionType === "cancel" && (
                    <>
                      Esta acción liberará las reservas de stock. Si la orden ya
                      fue pagada, no podrás cancelarla.
                    </>
                  )}
                  {actionType === "change" && (
                    <>
                      Esta acción se registrará y puede afectar el inventario o
                      notificaciones al cliente.
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isChanging}
            >
              {isChanging ? "Actualizando..." : "Confirmar Cambio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
