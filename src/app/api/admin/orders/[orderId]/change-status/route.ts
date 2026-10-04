import {
  getOrderStatusLabel,
  isValidStatusTransition,
  SHIPPING_REQUIRED_MESSAGE,
} from "@/features/orders/utils/orderStatus";
import db from "@/lib/supabase/db";
import { orders, OrderStatus } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const changeStatusSchema = z.object({
  newStatus: z.enum([
    "pending_confirmation",
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } },
) {
  try {
    const { orderId } = params;

    // Verificar que el usuario sea admin
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!user.app_metadata?.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Auth first: anonymous callers learn nothing about the expected body
    const parsed = changeStatusSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (parsed.success === false) {
      return NextResponse.json(
        { error: "El nuevo estado es requerido" },
        { status: 400 },
      );
    }
    const newStatus = parsed.data.newStatus as OrderStatus;

    // "paid" no debe setearse por cambio de estado: requiere consumir reservas y descontar stock.
    if (newStatus === "paid") {
      return NextResponse.json(
        {
          error: "Estado inválido",
          message:
            "Para marcar una orden como pagada usa la acción 'Marcar como pagada' (endpoint mark-paid).",
        },
        { status: 400 },
      );
    }

    // "cancelled" must go through the cancel endpoint, which releases reservations / restocks.
    if (newStatus === "cancelled") {
      return NextResponse.json(
        {
          error: "Estado inválido",
          message:
            "Para cancelar una orden usa la acción 'Cancelar orden' (endpoint cancel).",
        },
        { status: 400 },
      );
    }

    // Realizar operación en transacción
    const result = await db.transaction(async (tx) => {
      // 1. Verificar que la orden existe
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order) {
        throw new Error("Orden no encontrada");
      }

      const currentStatus = order.order_status as OrderStatus;

      // The customer is told "Total a pagar" on confirmation, so the shipping must be set first
      if (newStatus === "pending_payment" && order.shipping_cost === null) {
        throw new Error(SHIPPING_REQUIRED_MESSAGE);
      }

      // No permitir avanzar a estados operativos si el pago no está confirmado
      // (evita órdenes "processing/shipped/delivered" con payment_status = unpaid).
      if (
        (newStatus === "processing" ||
          newStatus === "shipped" ||
          newStatus === "delivered") &&
        order.payment_status !== "paid"
      ) {
        throw new Error(
          "No puedes avanzar el pedido si el pago no está confirmado. Marca la orden como pagada primero.",
        );
      }

      // 2. Verificar que la transición de estado es válida
      if (!isValidStatusTransition(currentStatus, newStatus)) {
        throw new Error(
          `No se puede cambiar de "${getOrderStatusLabel(currentStatus)}" a "${getOrderStatusLabel(newStatus)}"`,
        );
      }

      // 3. Actualizar estado de la orden
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          order_status: newStatus,
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      order: result,
      message: `Estado actualizado a ${getOrderStatusLabel(newStatus)}`,
    });
  } catch (error: any) {
    console.error("Error changing order status:", error);

    return NextResponse.json(
      {
        error: "Error al cambiar estado de la orden",
        message: error.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}
