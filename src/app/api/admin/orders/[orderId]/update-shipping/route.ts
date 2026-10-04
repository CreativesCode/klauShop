import db from "@/lib/supabase/db";
import { orders } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateShippingSchema = z.object({
  shippingCost: z.number().min(0).nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } },
) {
  try {
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

    const body = await request.json();
    const parsed = updateShippingSchema.safeParse(body);
    if (parsed.success === false) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { shippingCost } = parsed.data;

    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, params.orderId))
        .for("update");

      if (!order) {
        throw new Error("Orden no encontrada");
      }

      // Once paid the amount is final (it is in the revenue and was charged)
      if (
        order.order_status !== "pending_confirmation" &&
        order.order_status !== "pending_payment"
      ) {
        throw new Error(
          "El envío solo se puede cambiar antes de que el pedido esté pagado.",
        );
      }

      const currentAmount = Number(order.amount || "0");
      const oldShipping = Number(order.shipping_cost || "0");
      const amountWithoutShipping = currentAmount - oldShipping;

      const nextAmount =
        shippingCost === null
          ? amountWithoutShipping
          : amountWithoutShipping + shippingCost;

      const [updated] = await tx
        .update(orders)
        .set({
          shipping_cost: shippingCost === null ? null : shippingCost.toString(),
          amount: nextAmount.toString(),
        })
        .where(eq(orders.id, params.orderId))
        .returning();

      return updated;
    });

    return NextResponse.json({ success: true, order: result }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating shipping cost:", error);
    return NextResponse.json(
      {
        error: "Error actualizando costo de envío",
        message: error.message || "Error desconocido",
      },
      { status: 500 },
    );
  }
}
