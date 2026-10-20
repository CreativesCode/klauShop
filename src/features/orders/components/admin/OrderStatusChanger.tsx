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
import { useToast } from "@/components/ui/use-toast";
import { OrderStatus } from "@/lib/supabase/schema";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ORDER_STATUS_ACTIONS,
  SHIPPING_REQUIRED_MESSAGE,
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

  // Main action = the next step of the flow; the rest are alternatives
  const forward = availableStatuses.filter((s) => s !== "cancelled");
  const primary = forward[0];
  const alternatives = forward.slice(1);
  const canCancel = availableStatuses.includes("cancelled");
  const blockedBy = (s: OrderStatus) =>
    shippingPending && (s === "pending_payment" || s === "paid");

  return (
    <>
      <section className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5">
        <h2 className="text-[15px] font-extrabold text-ink">Siguiente paso</h2>

        {primary ? (
          <>
            <p className="text-sm text-neutral-600">
              {ORDER_STATUS_ACTIONS[primary].description}
            </p>
            {blockedBy(primary) && (
              <p className="rounded-xl bg-orange-50 px-3.5 py-2.5 text-[13px] font-bold text-orange-700">
                {SHIPPING_REQUIRED_MESSAGE}
              </p>
            )}
            <Button
              onClick={() => handleStatusChange(primary)}
              disabled={isBusy || blockedBy(primary)}
              className="h-[50px] w-full rounded-xl text-[15px] disabled:bg-primary-300 disabled:opacity-100"
            >
              {ORDER_STATUS_ACTIONS[primary].label}
            </Button>

            {(alternatives.length > 0 ||
              availableStatuses.includes("paid")) && (
              <div className="flex flex-col gap-2">
                {alternatives.map((s) => (
                  <Button
                    key={s}
                    variant="soft"
                    onClick={() => handleStatusChange(s)}
                    disabled={isBusy || blockedBy(s)}
                    className="h-11 w-full rounded-xl"
                  >
                    {ORDER_STATUS_ACTIONS[s].label}
                  </Button>
                ))}
                {availableStatuses.includes("paid") && (
                  <Button
                    variant="soft"
                    onClick={handlePaidAndDelivered}
                    disabled={isBusy || shippingPending}
                    title="Cobrado y entregado en el momento (p. ej. recogida en tienda)"
                    className="h-11 w-full rounded-xl"
                  >
                    Pagada y entregada
                  </Button>
                )}
              </div>
            )}
          </>
        ) : !canCancel ? (
          <p className="rounded-xl bg-surface-soft px-3.5 py-2.5 text-sm text-neutral-600">
            Estado final: no admite más cambios.
          </p>
        ) : null}

        {canCancel && (
          <Button
            variant="destructiveSoft"
            onClick={() => handleStatusChange("cancelled")}
            disabled={isBusy}
            className="h-11 w-full rounded-xl"
          >
            Cancelar orden · {isPaid ? "devuelve el stock" : "libera el stock"}
          </Button>
        )}

        {needsRefund(status, payment) && (
          <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3.5">
            <p className="text-sm font-bold text-amber-800">
              Reembolso pendiente
            </p>
            <p className="text-xs text-neutral-600">
              Estaba pagada cuando se canceló. Devuélvele el dinero al cliente y
              márcalo aquí.
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
      </section>

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
