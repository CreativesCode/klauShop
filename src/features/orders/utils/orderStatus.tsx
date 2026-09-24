import { OrderStatus } from "@/lib/supabase/schema";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

export type OrderStatusInfo = {
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
};

export const ORDER_STATUS_INFO: Record<OrderStatus, OrderStatusInfo> = {
  pending_confirmation: {
    label: "Pendiente de Confirmación",
    description: "Orden creada, esperando confirmación del admin",
    icon: Clock,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
  },
  pending_payment: {
    label: "Pendiente de Pago",
    description: "Esperando confirmación de pago",
    icon: CreditCard,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
  },
  paid: {
    label: "Pagada",
    description: "Pago confirmado, listo para procesar",
    icon: CheckCircle2,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
  },
  processing: {
    label: "Procesando",
    description: "Preparando el pedido",
    icon: Package,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
  },
  shipped: {
    label: "Enviado",
    description: "En camino al cliente",
    icon: Truck,
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
  },
  delivered: {
    label: "Entregado",
    description: "Orden entregada al cliente",
    icon: PackageCheck,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
  },
  cancelled: {
    label: "Cancelada",
    description: "Orden cancelada",
    icon: XCircle,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
  },
};

/**
 * Obtiene la información de visualización para un estado de orden
 */
export function getOrderStatusInfo(
  status: OrderStatus | string,
): OrderStatusInfo | undefined {
  return ORDER_STATUS_INFO[status as OrderStatus];
}

/**
 * Transiciones de estado válidas
 * Define qué estados pueden cambiar a qué otros estados
 *
 * Single source of truth for the admin UI and every order endpoint.
 * "paid" goes through mark-paid (consumes reservations, deducts stock) and
 * "cancelled" through cancel (releases reservations / restocks paid orders).
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ["pending_payment", "paid", "cancelled"],
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [], // Estado final, no puede cambiar
  cancelled: [], // Estado final, no puede cambiar
};

export type OrderStatusAction = {
  label: string;
  description: string;
};

/**
 * Admin action that moves an order INTO each status (button copy).
 */
export const ORDER_STATUS_ACTIONS: Record<
  Exclude<OrderStatus, "pending_confirmation">,
  OrderStatusAction
> = {
  pending_payment: {
    label: "Confirmar orden",
    description: "Aceptar el pedido; queda pendiente de pago",
  },
  paid: {
    label: "Marcar como pagada",
    description: "Pago recibido; descuenta el stock",
  },
  processing: {
    label: "Empezar a preparar",
    description: "El pedido pasa a preparación",
  },
  shipped: {
    label: "Marcar como enviada",
    description: "El pedido va en camino al cliente",
  },
  delivered: {
    label: "Marcar como entregada",
    description: "El cliente recibió el pedido",
  },
  cancelled: {
    label: "Cancelar orden",
    description: "Libera el stock reservado",
  },
};

export function getOrderStatusLabel(status: OrderStatus | string): string {
  return getOrderStatusInfo(status)?.label ?? status;
}

/**
 * Verifica si una transición de estado es válida
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  return validTransitions.includes(newStatus);
}

/**
 * Obtiene los estados válidos a los que puede cambiar un estado actual
 */
export function getValidNextStatuses(
  currentStatus: OrderStatus,
): OrderStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}
