import { OrderStatus } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { getOrderStatusInfo } from "../utils/orderStatus";

// The happy path of an order, in order (cancelled is shown apart)
const FLOW: OrderStatus[] = [
  "pending_confirmation",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

type Props = {
  status: OrderStatus;
  className?: string;
};

/** Read-only order stepper (admin detail and the customer's order page). */
function OrderProgress({ status = "pending_confirmation", className }: Props) {
  const cancelled = status === "cancelled";
  const current = FLOW.indexOf(status);
  // Delivered is final: every step is done
  const doneUntil = status === "delivered" ? FLOW.length : current;

  return (
    <section
      aria-label="Progreso de la orden"
      className={cn(
        "no-scrollbar overflow-x-auto rounded-[18px] border border-line bg-white px-[18px] py-4",
        className,
      )}
    >
      {cancelled && (
        <p className="mb-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-[13px] font-bold text-red-700">
          Orden cancelada
        </p>
      )}
      <ol className="flex min-w-[640px] items-center gap-2">
        {FLOW.map((step, index) => {
          const done = !cancelled && index < doneUntil;
          const isCurrent = !cancelled && index === current && !done;
          return (
            <li
              key={step}
              className="flex flex-1 items-center gap-2 last:flex-none"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums",
                  done
                    ? "bg-primary text-white"
                    : isCurrent
                      ? "border-2 border-primary bg-white text-primary"
                      : "bg-surface-soft text-neutral-400",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[13px] font-bold",
                  done || isCurrent ? "text-ink" : "text-neutral-400",
                )}
              >
                {getOrderStatusInfo(step)?.shortLabel}
              </span>
              {index < FLOW.length - 1 && (
                <span
                  className={cn(
                    "h-0.5 min-w-4 flex-1 rounded-full",
                    !cancelled && index < doneUntil ? "bg-primary" : "bg-line",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default OrderProgress;
