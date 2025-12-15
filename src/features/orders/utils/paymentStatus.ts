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
