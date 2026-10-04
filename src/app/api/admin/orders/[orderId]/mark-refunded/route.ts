import { needsRefund } from "@/features/orders/utils/paymentStatus";
import db from "@/lib/supabase/db";
import { orders } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * The money of a cancelled paid order was returned (outside the app).
 * Only payment_status changes, so the order-status WhatsApp trigger does not fire.
 */
export async function POST(
  _request: Request,
  { params }: { params: { orderId: string } },
) {
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

  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({
          order_status: orders.order_status,
          payment_status: orders.payment_status,
        })
        .from(orders)
        .where(eq(orders.id, params.orderId))
        .for("update");

      if (!order) return { status: 404, message: "Orden no encontrada" };
      if (!needsRefund(order.order_status, order.payment_status)) {
        return {
          status: 409,
          message:
            "Solo se marcan como reembolsadas las órdenes canceladas que estaban pagadas.",
        };
      }

      await tx
        .update(orders)
        .set({ payment_status: "refunded" })
        .where(eq(orders.id, params.orderId));
      return { status: 200, message: "Orden marcada como reembolsada" };
    });

    return NextResponse.json(
      { success: result.status === 200, message: result.message },
      { status: result.status },
    );
  } catch (error) {
    console.error("Error marking order as refunded:", error);
    return NextResponse.json(
      { message: "No se pudo marcar como reembolsada. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
