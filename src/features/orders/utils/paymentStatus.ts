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
    label: "Pendiente",
    badgeVariant: "secondary",
  },
  no_payment_required: {
    label: "No requiere pago",
    badgeVariant: "outline",
  },
};

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
): PaymentStatusInfo {
  if (!status) return PAYMENT_STATUS_INFO.unpaid;
  return (
    PAYMENT_STATUS_INFO[status as PaymentStatus] ?? {
      label: status,
      badgeVariant: "outline",
    }
  );
}
