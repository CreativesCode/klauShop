import type { PaymentStatus } from "@/lib/supabase/schema";

export type PaymentStatusInfo = {
  label: string;
  badgeVariant: "default" | "secondary" | "outline";
  className?: string;
};

const PAYMENT_STATUS_INFO: Record<PaymentStatus, PaymentStatusInfo> = {
  paid: {
    label: "Pagado",
    badgeVariant: "default",
  },
  unpaid: {
    label: "Sin pagar",
    badgeVariant: "secondary",
  },
  no_payment_required: {
    label: "No requiere pago",
    badgeVariant: "outline",
  },
  refunded: {
    label: "Reembolsado",
    badgeVariant: "outline",
  },
};

const REFUND_PENDING: PaymentStatusInfo = {
  label: "Reembolso pendiente",
  badgeVariant: "outline",
  className: "text-amber-700 border-amber-500",
};

/** Cancelled after being paid: the money still has to be returned (done outside the app). */
export function needsRefund(
  orderStatus: string | null | undefined,
  paymentStatus: string | null | undefined,
): boolean {
  return orderStatus === "cancelled" && paymentStatus === "paid";
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  card: "Tarjeta",
};

export function getPaymentMethodLabel(
  method: string | null | undefined,
): string {
  if (!method) return "N/A";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function getPaymentStatusInfo(
  status: PaymentStatus | string | null | undefined,
  // Pass it so a cancelled paid order reads "Reembolso pendiente"
  orderStatus?: string | null,
): PaymentStatusInfo {
  if (needsRefund(orderStatus, status)) return REFUND_PENDING;
  if (!status) return PAYMENT_STATUS_INFO.unpaid;
  return (
    PAYMENT_STATUS_INFO[status as PaymentStatus] ?? {
      label: status,
      badgeVariant: "outline",
    }
  );
}
