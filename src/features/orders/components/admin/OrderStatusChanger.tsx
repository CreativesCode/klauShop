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
import { useEffect, useState, useTransition } from "react";
import {
  ORDER_STATUS_ACTIONS,
  getOrderStatusInfo,
  getValidNextStatuses,
} from "../../utils/orderStatus";
import { needsRefund } from "../../utils/paymentStatus";

type OrderStatusChangerProps = {
  orderId: string;
  currentStatus: OrderStatus;
  paymentStatus: string;
  // Shipping still agreed over WhatsApp: confirming/marking paid is blocked until it is set
  shippingPending?: boolean;
};

export default function OrderStatusChanger({
  orderId,
  currentStatus,
  paymentStatus,
  shippingPending = false,
}: OrderStatusChangerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(
    null,
  );
  const [isChanging, setIsChanging] = useState(false);
  // Shown right after a successful action, until router.refresh() brings the new props
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [payment, setPayment] = useState(paymentStatus);
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = isChanging || isRefreshing;

  useEffect(() => {
    setStatus(currentStatus);
    setPayment(paymentStatus);
  }, [currentStatus, paymentStatus]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<
    "change" | "mark-paid" | "mark-paid-deliver" | "cancel"
  >("change");
  const { toast } = useToast();
  const router = useRouter();

  const validNextStatuses = getValidNextStatuses(status);

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

  const isPaid = payment === "paid";

  // Construir lista de estados disponibles
  const availableStatuses = validNextStatuses.filter(
    (status): status is Exclude<OrderStatus, "pending_confirmation"> =>
      status !== "pending_confirmation" && !(status === "paid" && isPaid),
  );

  const currentStatusInfo = getOrderStatusInfo(status) || {
    label: "Desconocido",
    description: "Estado desconocido",
    icon: () => null,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
  };
  const CurrentIcon = currentStatusInfo.icon;

  // Pickup / delivered on the spot: paid and delivered in one step (one WhatsApp to the customer)
  const handlePaidAndDelivered = () => {
    setSelectedStatus("delivered");
    setActionType("mark-paid-deliver");
    setShowConfirmDialog(true);
  };

  const [isRefunding, setIsRefunding] = useState(false);
  const markRefunded = async () => {
    if (!window.confirm("¿Ya le devolviste el dinero al cliente?")) return;
    setIsRefunding(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/mark-refunded`,
        {
          method: "POST",
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "No se pudo marcar como reembolsada");
      }
      setPayment("refunded");
      toast({ title: "Reembolso registrado" });
      startRefresh(() => router.refresh());
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
    }
  };

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

      if (actionType === "mark-paid-deliver") {
        response = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliver: true }),
        });
        successMessage =
          "Orden pagada y entregada. El stock ha sido descontado.";
      } else if (actionType === "mark-paid") {
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
        successMessage = isPaid
          ? "Orden cancelada. El stock ha sido devuelto al inventario."
          : "Orden cancelada. El stock reservado ha sido liberado.";
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

      setStatus(selectedStatus);
      if (actionType === "mark-paid" || actionType === "mark-paid-deliver")
        setPayment("paid");
      setShowConfirmDialog(false);
      setSelectedStatus(null);
      startRefresh(() => router.refresh());
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
              <Label>Acciones</Label>
              <div className="grid grid-cols-1 gap-2">
                {availableStatuses.map((status) => {
                  const statusInfo = getOrderStatusInfo(status);
                  if (!statusInfo) return null;
                  const action = ORDER_STATUS_ACTIONS[status];
                  const Icon = statusInfo.icon;
                  const blockedByShipping =
                    shippingPending &&
                    (status === "pending_payment" || status === "paid");
                  return (
                    <Button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isBusy || blockedByShipping}
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
                          {action.label}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-normal text-left">
                          {blockedByShipping
                            ? "Primero define el costo de envío (junto al total)"
                            : status === "cancelled" && isPaid
                              ? "Devuelve el stock; el reembolso se hace fuera de la app"
                              : action.description}
                        </span>
                      </div>
                    </Button>
                  );
                })}
                {availableStatuses.includes("paid") && (
                  <Button
                    onClick={handlePaidAndDelivered}
                    disabled={isBusy || shippingPending}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                  >
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium text-emerald-700">
                        Pagada y entregada
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-normal text-left">
                        {shippingPending
                          ? "Primero define el costo de envío (junto al total)"
                          : "Cobrado y entregado en el momento (p. ej. recogida en tienda)"}
                      </span>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                Esta orden está en un estado final y no puede cambiar.
              </div>
              {needsRefund(status, payment) && (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800">
                    Reembolso pendiente
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estaba pagada cuando se canceló. Devuélvele el dinero al
                    cliente y márcalo aquí.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isRefunding}
                    onClick={markRefunded}
                  >
                    {isRefunding ? "Guardando..." : "Marcar como reembolsado"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "mark-paid-deliver"
                ? "¿Marcar como pagada y entregada?"
                : selectedStatus && selectedStatus !== "pending_confirmation"
                  ? `¿${ORDER_STATUS_ACTIONS[selectedStatus].label}?`
                  : "¿Cambiar estado de la orden?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus && (
                <>
                  La orden pasará de <strong>{currentStatusInfo.label}</strong>{" "}
                  a{" "}
                  <strong>
                    {getOrderStatusInfo(selectedStatus)?.label ||
                      selectedStatus}
                  </strong>
                  .
                  <br />
                  <br />
                  {(actionType === "mark-paid" ||
                    actionType === "mark-paid-deliver") && (
                    <>
                      Se descontará el stock de los productos. Esta acción no se
                      puede deshacer.
                    </>
                  )}
                  {actionType === "cancel" &&
                    (isPaid ? (
                      <>
                        La orden ya está pagada: el stock se devolverá al
                        inventario. El reembolso al cliente se gestiona fuera de
                        la app. Esta acción no se puede deshacer.
                      </>
                    ) : (
                      <>
                        Se liberará el stock reservado. Esta acción no se puede
                        deshacer.
                      </>
                    ))}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={isBusy}>
              {isChanging ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
