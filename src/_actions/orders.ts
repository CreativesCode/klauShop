"use server";

import db from "@/lib/supabase/db";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import {
  inventoryReservations,
  orderLines,
  orders,
} from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

// Only orders that never consumed stock (or already released it) can be deleted;
// paid/shipped/delivered orders are purchase history.
const DELETABLE_STATUSES = ["pending_confirmation", "cancelled"];

export const deleteOrderAction = async (orderId: string) => {
  await requireAdmin();

  return await db.transaction(async (tx) => {
    // Verificar que la orden existe (y bloquearla)
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");

    if (!order) {
      throw new Error("La orden no existe.");
    }

    if (!DELETABLE_STATUSES.includes(order.order_status ?? "")) {
      throw new Error(
        "Solo se pueden eliminar órdenes pendientes de confirmación o canceladas.",
      );
    }

    // Eliminar primero las orderLines (tienen onDelete: "restrict")
    await tx.delete(orderLines).where(eq(orderLines.orderId, orderId));

    // Las reservas activas se liberan al borrarlas
    await tx
      .delete(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderId));

    // Finalmente eliminar la orden
    const deletedOrder = await tx
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning();

    if (deletedOrder.length === 0) {
      throw new Error("No se pudo eliminar la orden.");
    }

    return deletedOrder;
  });
};
