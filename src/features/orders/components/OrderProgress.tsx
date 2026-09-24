"use client";
import { Progress } from "@/components/ui/progress";
import { OrderStatus } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";
import React from "react";
// Mapeo de estados a progreso y etapas
const STATUS_STEPS = {
  pending_confirmation: { step: 0, progress: 0 },
  pending_payment: { step: 1, progress: 33 },
  paid: { step: 1, progress: 45 },
  processing: { step: 1, progress: 55 },
  shipped: { step: 2, progress: 67 },
  delivered: { step: 3, progress: 100 },
  cancelled: { step: 0, progress: 0 },
};

const STEPS = [
  { label: "Recibida", icon: Package },
  { label: "Confirmada", icon: CheckCircle2 },
  { label: "Enviada", icon: Truck },
  { label: "Entregada", icon: PackageCheck },
];

type Props = {
  status: OrderStatus;
};

function OrderProgress({ status = "pending_confirmation" }: Props) {
  const [progress, setProgress] = React.useState(0);
  const statusInfo = STATUS_STEPS[status];
  const currentStep = statusInfo.step;
  const targetProgress = statusInfo.progress;

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(targetProgress), 200);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  // Si está cancelada, mostrar mensaje
  if (status === "cancelled") {
    return (
      <section className="py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-red-600">
          <XCircle className="h-6 w-6" />
          <p className="text-lg font-medium">Orden Cancelada</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-8 min-h-[120px] w-full max-w-4xl mx-auto">
      {/* Círculos de estado */}
      <div className="relative">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const StepIcon = step.icon;
          const position = `${(index * 100) / (STEPS.length - 1)}%`;

          return (
            <div
              key={index}
              className="absolute top-0 -translate-x-1/2 z-30"
              style={{ left: position }}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted || isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-zinc-200 text-muted-foreground",
                )}
              >
                <StepIcon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de progreso */}
      <Progress value={progress} className="my-5 h-2" />

      {/* Labels */}
      <div className="relative h-12 mt-4">
        {STEPS.map((step, index) => {
          const position = `${(index * 100) / (STEPS.length - 1)}%`;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              className="absolute -translate-x-1/2"
              style={{ left: position }}
            >
              <p
                className={cn(
                  "text-sm text-center whitespace-nowrap transition-colors",
                  isCompleted || isCurrent
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default OrderProgress;
