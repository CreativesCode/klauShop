import db from "@/lib/supabase/db";
import { inventoryReservations, products } from "@/lib/supabase/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { CreateWhatsAppOrderInput } from "../validations";

type QueryExecutor = Pick<typeof db, "select">;
type CartQuantity = Pick<
  CreateWhatsAppOrderInput["cartItems"][number],
  "productId" | "quantity"
>;

/**
 * Available stock of a product = products.stock - ALL its active reservations.
 * Stock is tracked per product (colors/sizes are just options), so reservations
 * of every variant count against the same stock.
 * Pass the transaction as `executor` when checking inside a checkout.
 */
export async function getAvailableStock(
  productId: string,
  executor: QueryExecutor = db,
): Promise<number> {
  const product = await executor
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product.length || product[0].stock === null) {
    return 0;
  }

  const reservedQtyResult = await executor
    .select({
      total: sql<number>`COALESCE(SUM(${inventoryReservations.quantity}), 0)`,
    })
    .from(inventoryReservations)
    .where(
      and(
        eq(inventoryReservations.productId, productId),
        eq(inventoryReservations.status, "active"),
      ),
    );

  const reservedQty = Number(reservedQtyResult[0]?.total || 0);

  return Math.max(0, product[0].stock - reservedQty);
}

/** Total requested quantity per product (a cart may hold several variants of one product). */
export function sumQuantitiesByProduct(
  items: CartQuantity[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(
      item.productId,
      (totals.get(item.productId) ?? 0) + item.quantity,
    );
  }
  return totals;
}

/**
 * Throws `OUT_OF_STOCK: ...` if any product lacks stock for the whole cart.
 * Must run inside the transaction that locked the products (FOR UPDATE).
 */
export async function assertCartStock(
  tx: QueryExecutor,
  items: CartQuantity[],
  productsData: { id: string; name: string }[],
): Promise<void> {
  for (const [productId, requested] of sumQuantitiesByProduct(items)) {
    const available = await getAvailableStock(productId, tx);
    if (available < requested) {
      const name =
        productsData.find((p) => p.id === productId)?.name || "Producto";
      throw new Error(
        `OUT_OF_STOCK: ${name} - Disponible: ${available}, Solicitado: ${requested}`,
      );
    }
  }
}

/**
 * Reserva stock para un producto en una orden (dentro de una transacción)
 * IMPORTANTE: Esta función debe llamarse dentro de una transacción con lock
 * @param tx - Transacción de Drizzle
 * @param orderId - ID de la orden
 * @param productId - ID del producto
 * @param quantity - Cantidad a reservar
 * @param variantOptions - Opciones de la variante
 * @returns ID de la reserva creada
 */
export async function createReservation(
  tx: any,
  orderId: string,
  productId: string,
  quantity: number,
  variantOptions?: {
    color?: string | null;
    size?: string | null;
    material?: string | null;
  },
): Promise<string> {
  const [reservation] = await tx
    .insert(inventoryReservations)
    .values({
      orderId,
      productId,
      quantity,
      color: variantOptions?.color || null,
      size: variantOptions?.size || null,
      material: variantOptions?.material || null,
      status: "active",
    })
    .returning({ id: inventoryReservations.id });

  return reservation.id;
}

/**
 * Libera las reservas de una orden (cambia estado a 'released')
 * Active reservations are simply released; consumed ones (order already paid)
 * also give their quantity back to products.stock.
 * IMPORTANTE: Esta función debe llamarse dentro de una transacción
 * @param tx - Transacción de Drizzle
 * @param orderId - ID de la orden
 */
export async function releaseReservations(
  tx: any,
  orderId: string,
): Promise<void> {
  const reservations = await tx
    .select()
    .from(inventoryReservations)
    .where(
      and(
        eq(inventoryReservations.orderId, orderId),
        inArray(inventoryReservations.status, ["active", "consumed"]),
      ),
    );

  for (const reservation of reservations) {
    if (reservation.status === "consumed") {
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${reservation.quantity}`,
        })
        .where(eq(products.id, reservation.productId));
    }
  }

  await tx
    .update(inventoryReservations)
    .set({
      status: "released",
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(inventoryReservations.orderId, orderId),
        inArray(inventoryReservations.status, ["active", "consumed"]),
      ),
    );
}

/**
 * Consume las reservas de una orden y descuenta el stock real
 * IMPORTANTE: Esta función debe llamarse dentro de una transacción
 * @param tx - Transacción de Drizzle
 * @param orderId - ID de la orden
 */
export async function consumeReservationsAndDeductStock(
  tx: any,
  orderId: string,
): Promise<void> {
  // Obtener todas las reservas activas de la orden
  const reservations = await tx
    .select()
    .from(inventoryReservations)
    .where(
      and(
        eq(inventoryReservations.orderId, orderId),
        eq(inventoryReservations.status, "active"),
      ),
    );

  if (!reservations.length) {
    throw new Error("No active reservations found for this order");
  }

  // Marcar reservas como consumidas
  await tx
    .update(inventoryReservations)
    .set({
      status: "consumed",
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(inventoryReservations.orderId, orderId),
        eq(inventoryReservations.status, "active"),
      ),
    );

  // Descontar stock de cada producto
  for (const reservation of reservations) {
    await tx
      .update(products)
      .set({
        stock: sql`${products.stock} - ${reservation.quantity}`,
      })
      .where(eq(products.id, reservation.productId));
  }
}
