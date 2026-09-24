import { releaseReservations } from "@/features/orders/utils/inventory";
import {
  getOrderStatusLabel,
  isValidStatusTransition,
} from "@/features/orders/utils/orderStatus";
import db from "@/lib/supabase/db";
import { OrderStatus, orders } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { eq } from "drizzle-orm";
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

      if (!isValidStatusTransition(currentStatus, "cancelled")) {
        throw new Error(
          `No se puede cancelar una orden en estado "${getOrderStatusLabel(currentStatus)}"`,
        );
      }

      // 2. Liberar reservas (si ya estaba pagada, devuelve el stock)
      await releaseReservations(tx, orderId);

      // 3. Actualizar estado de la orden
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          order_status: "cancelled",
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      order: result,
      message: "Orden cancelada y stock liberado",
    });
  } catch (error: any) {
    console.error("Error cancelling order:", error);

    return NextResponse.json(
      {
        error: "Error al cancelar orden",
        message: error.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}
