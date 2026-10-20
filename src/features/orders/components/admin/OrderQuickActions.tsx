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
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ORDER_STATUS_ACTIONS,
  SHIPPING_REQUIRED_MESSAGE,
  getValidNextStatuses,
} from "../../utils/orderStatus";
import { needsRefund } from "../../utils/paymentStatus";
import { formatOrderNumber } from "../../utils/whatsapp";

type QuickAction = {
  key: string;
  label: string;
  /** Compact label for the row button ("Confirmar", "Preparar"…) */
  shortLabel: string;
  // Shown in the confirmation dialog; actions without it run directly
  confirm?: string;
  run: () => Promise<Response>;
};

type OrderQuickActionsProps = {
  orderId: string;
  status: OrderStatus;
  paymentStatus: string | null;
  shippingPending: boolean;
};

const post = (url: string, body?: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/**
 * Shortcuts so the common path does not need the detail page:
 * confirm, mark paid, paid + delivered (one WhatsApp) and the next fulfilment step.
 * Cancelling stays in the detail page (it needs more context).
 */
function useOrderQuickActions({
  orderId,
  status,
  paymentStatus,
  shippingPending,
}: OrderQuickActionsProps) {
  const [pending, setPending] = useState<QuickAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [, startRefresh] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const base = `/api/admin/orders/${orderId}`;
  const orderNumber = formatOrderNumber(orderId);

  const next = getValidNextStatuses(status);
  const canPay = next.includes("paid") && paymentStatus !== "paid";
  const actions: QuickAction[] = [];

  if (next.includes("pending_payment")) {
    actions.push({
      key: "confirm",
      label: ORDER_STATUS_ACTIONS.pending_payment.label,
      shortLabel: "Confirmar",
      run: () =>
        post(`${base}/change-status`, { newStatus: "pending_payment" }),
    });
  }
  if (canPay) {
    actions.push(
      {
        key: "paid",
        label: ORDER_STATUS_ACTIONS.paid.label,
        shortLabel: "Marcar pagada",
        confirm: `Se descontará el stock de ${orderNumber}. No se puede deshacer.`,
        run: () => post(`${base}/mark-paid`),
      },
      {
        key: "paid-delivered",
        label: "Pagada y entregada",
        shortLabel: "Pagada y entregada",
        confirm: `${orderNumber} quedará pagada y entregada y se descontará el stock. El cliente recibe un solo aviso. No se puede deshacer.`,
        run: () => post(`${base}/mark-paid`, { deliver: true }),
      },
    );
  }
  const stepLabels = {
    processing: "Preparar",
    shipped: "Marcar enviada",
    delivered: "Entregada",
  } as const;
  for (const step of ["processing", "shipped", "delivered"] as const) {
    if (next.includes(step)) {
      actions.push({
        key: step,
        label: ORDER_STATUS_ACTIONS[step].label,
        shortLabel: stepLabels[step],
        run: () => post(`${base}/change-status`, { newStatus: step }),
      });
    }
  }

  if (needsRefund(status, paymentStatus)) {
    actions.push({
      key: "refunded",
      label: "Marcar como reembolsado",
      shortLabel: "Reembolsado",
      confirm: `Confirma que ya le devolviste el dinero al cliente de ${orderNumber}.`,
      run: () => post(`${base}/mark-refunded`),
    });
  }

  const execute = async (action: QuickAction) => {
    setIsRunning(true);
    try {
      const response = await action.run();
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar la orden");
      }
      toast({ title: `${orderNumber}: ${action.label.toLowerCase()} ✓` });
      setPending(null);
      startRefresh(() => router.refresh());
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Confirming or charging needs the shipping cost (the API rejects it too)
  const blocked = (key: string) =>
    shippingPending && ["confirm", "paid", "paid-delivered"].includes(key);

  const trigger = (action: QuickAction) => {
    if (action.confirm) setPending(action);
    else execute(action);
  };

  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿{pending?.label}?</AlertDialogTitle>
          <AlertDialogDescription>{pending?.confirm}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isRunning}
            onClick={(e) => {
              e.preventDefault();
              if (pending) execute(pending);
            }}
          >
            {isRunning ? "Actualizando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { actions, isRunning, blocked, trigger, setPending, execute, dialog };
}

/** Row menu items (inside a DropdownMenuContent). */
export function OrderQuickActions(props: OrderQuickActionsProps) {
  const { actions, isRunning, blocked, setPending, execute, dialog } =
    useOrderQuickActions(props);

  if (actions.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      {actions.map((action) => (
        <DropdownMenuItem
          key={action.key}
          disabled={isRunning || blocked(action.key)}
          onSelect={(e) => {
            if (action.confirm) {
              e.preventDefault();
              setPending(action);
            } else {
              execute(action);
            }
          }}
        >
          {action.label}
          {blocked(action.key) && (
            <span className="ml-1 text-xs text-muted-foreground">
              (falta el envío)
            </span>
          )}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      {dialog}
    </>
  );
}

/**
 * Visible "next step" button of order rows (dashboard and orders table):
 * primary while the order is pending, soft for the fulfilment steps.
 */
export function OrderNextActionButton({
  className,
  ...props
}: OrderQuickActionsProps & { className?: string }) {
  const { actions, isRunning, blocked, trigger, dialog } =
    useOrderQuickActions(props);
  const action = actions[0];
  if (!action) return null;

  const isPending =
    props.status === "pending_confirmation" ||
    props.status === "pending_payment";
  const isBlocked = blocked(action.key);

  return (
    <>
      <Button
        size="sm"
        variant={isPending ? "default" : "soft"}
        disabled={isRunning || isBlocked}
        title={isBlocked ? SHIPPING_REQUIRED_MESSAGE : action.label}
        onClick={(e) => {
          // Rows are links on some layouts
          e.preventDefault();
          e.stopPropagation();
          trigger(action);
        }}
        className={cn(isBlocked && "disabled:bg-primary-300", className)}
      >
        {action.shortLabel}
      </Button>
      {dialog}
    </>
  );
}

export default OrderQuickActions;
