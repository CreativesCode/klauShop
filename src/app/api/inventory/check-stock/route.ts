import { getAvailableStock } from "@/features/orders/utils/inventory";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkStockSchema = z.object({
  productId: z.string().min(1),
  requestedQty: z.coerce.number().int().positive(),
  color: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = checkStockSchema.safeParse(await request.json());

    if (parsed.success === false) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { productId, requestedQty, color, size, material } = parsed.data;

    // Stock is per product: reservations of every variant count
    const availableStock = await getAvailableStock(productId);

    const hasStock = availableStock >= requestedQty;

    return NextResponse.json({
      productId,
      availableStock,
      requestedQty,
      hasStock,
      variant: {
        color: color || null,
        size: size || null,
        material: material || null,
      },
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
