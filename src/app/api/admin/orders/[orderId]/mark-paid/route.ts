import { consumeReservationsAndDeductStock } from "@/features/orders/utils/inventory";
import {
  getOrderStatusLabel,
  isValidStatusTransition,
} from "@/features/orders/utils/orderStatus";
import db from "@/lib/supabase/db";
import {
  OrderStatus,
  inventoryReservations,
  orders,
} from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    // Realizar operación en transacción
    const result = await db.transaction(async (tx) => {
      // 1. Verificar que la orden existe y está en estado válido
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order) {
        throw new Error("Orden no encontrada");
      }

      if (order.payment_status === "paid") {
        throw new Error("La orden ya está marcada como pagada");
      }

      const currentStatus = order.order_status as OrderStatus;

      // Legacy desynced orders (order_status=paid, payment_status=unpaid) can still be fixed here
      if (
        currentStatus !== "paid" &&
        !isValidStatusTransition(currentStatus, "paid")
      ) {
        throw new Error(
          `No se puede marcar como pagada una orden en estado "${getOrderStatusLabel(currentStatus)}"`,
        );
      }

      // 2. Consumir reservas y descontar stock (si aún existen reservas activas)
      // Esto hace el endpoint más robusto ante órdenes desincronizadas (order_status=paid pero payment_status=unpaid).
      const activeReservations = await tx
        .select({ id: inventoryReservations.id })
        .from(inventoryReservations)
        .where(
          and(
            eq(inventoryReservations.orderId, orderId),
            eq(inventoryReservations.status, "active"),
          ),
        )
        .limit(1);

      if (activeReservations.length > 0) {
        await consumeReservationsAndDeductStock(tx, orderId);
      }

      // 3. Actualizar estado de la orden
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          order_status: "paid",
          payment_status: "paid",
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      order: result,
      message: "Orden marcada como pagada y stock descontado",
    });
  } catch (error: any) {
    console.error("Error marking order as paid:", error);

    return NextResponse.json(
      {
        error: "Error al marcar orden como pagada",
        message: error.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}
