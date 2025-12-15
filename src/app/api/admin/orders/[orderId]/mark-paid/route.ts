import db from "@/lib/supabase/db";
import { inventoryReservations, orders } from "@/lib/supabase/schema";
import { NextResponse } from "next/server";
import { consumeReservationsAndDeductStock } from "@/features/orders/utils/inventory";
import { eq, and } from "drizzle-orm";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

    // Verificar si es admin (asumiendo que tienes esta información en el perfil)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
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

      if (order.order_status === "cancelled") {
        throw new Error("No se puede marcar como pagada una orden cancelada");
      }

      if (order.payment_status === "paid") {
        throw new Error("La orden ya está marcada como pagada");
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
