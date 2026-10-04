"use server";

import db from "@/lib/supabase/db";
import { revalidateStorefront } from "@/lib/revalidateStorefront";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import {
  InsertProducts,
  orderLines,
  productMedias,
  products,
} from "@/lib/supabase/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

type InsertProductMedias = {
  productId: string;
  mediaId: string;
  priority?: number | null;
};

const SLUG_TAKEN =
  "Ese slug ya existe. Usa otro (o genéralo de nuevo desde el nombre).";

// Unique violation on products.slug (postgres-js error, sometimes wrapped by drizzle)
function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export const createProductAction = async (
  product: InsertProducts,
  additionalImages?: string[],
) => {
  await requireAdmin();

  // Limpiar los datos antes de validar
  const cleanedProduct: InsertProducts = {
    ...product,
    // Asegurar que rating sea un string válido o usar el valor por defecto
    rating:
      product.rating === "" ||
      product.rating === null ||
      product.rating === undefined
        ? "4"
        : String(product.rating),
    // Convertir arrays vacíos a null para campos opcionales
    colors: product.colors && product.colors.length > 0 ? product.colors : null,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : null,
    materials:
      product.materials && product.materials.length > 0
        ? product.materials
        : null,
  };

  createInsertSchema(products).parse(cleanedProduct);
  let data;
  try {
    data = await db.insert(products).values(cleanedProduct).returning();
  } catch (error) {
    // Returned, not thrown: Next hides server action error messages in production
    if (isUniqueViolation(error)) return { error: SLUG_TAKEN };
    throw error;
  }

  // Guardar imágenes adicionales si existen
  if (data[0] && additionalImages && additionalImages.length > 0) {
    const productMediaRecords: InsertProductMedias[] = additionalImages
      .filter((mediaId) => mediaId && mediaId.trim() !== "")
      .map((mediaId, index) => ({
        productId: data[0].id,
        mediaId,
        priority: index + 1,
      }));

    if (productMediaRecords.length > 0) {
      await db.insert(productMedias).values(productMediaRecords);
    }
  }

  revalidateStorefront();
  return data;
};

export const updateProductAction = async (
  productId: string,
  product: InsertProducts,
  additionalImages?: string[],
  // Stock shown when the form was opened: a sale marked as paid meanwhile must not be overwritten
  originalStock?: number | null,
) => {
  await requireAdmin();

  // Limpiar los datos antes de validar
  const cleanedProduct: InsertProducts = {
    ...product,
    // Asegurar que rating sea un string válido
    rating:
      product.rating === "" ||
      product.rating === null ||
      product.rating === undefined
        ? undefined // No actualizar si está vacío
        : String(product.rating),
    // Convertir arrays vacíos a null para campos opcionales
    colors: product.colors && product.colors.length > 0 ? product.colors : null,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : null,
    materials:
      product.materials && product.materials.length > 0
        ? product.materials
        : null,
  };

  // Remover campos undefined para que no se actualicen
  const updateData = Object.fromEntries(
    Object.entries(cleanedProduct).filter(([_, v]) => v !== undefined),
  ) as InsertProducts;

  createInsertSchema(products).parse(updateData);

  // Thrown inside the tx to roll it back; returned (not thrown) because Next hides
  // server action error messages in production
  class StockChangedError extends Error {}

  let insertedProduct;
  try {
    insertedProduct = await db.transaction(async (tx) => {
      if (originalStock !== undefined) {
        if (updateData.stock === originalStock) {
          // Stock not edited: keep whatever the DB has now (mark-paid may have changed it)
          delete updateData.stock;
        } else {
          const [current] = await tx
            .select({ stock: products.stock })
            .from(products)
            .where(eq(products.id, productId))
            .for("update");
          if (current && current.stock !== originalStock) {
            throw new StockChangedError(
              `El stock cambió mientras editabas (ahora hay ${current.stock ?? 0}). Recarga la página y vuelve a intentarlo.`,
            );
          }
        }
      }

      return tx
        .update(products)
        .set(updateData)
        .where(eq(products.id, productId))
        .returning();
    });
  } catch (error) {
    if (error instanceof StockChangedError) return { error: error.message };
    if (isUniqueViolation(error)) return { error: SLUG_TAKEN };
    throw error;
  }

  // Actualizar imágenes adicionales: eliminar todas las existentes y crear las nuevas
  if (insertedProduct[0] && additionalImages !== undefined) {
    // Eliminar todas las imágenes adicionales existentes
    await db
      .delete(productMedias)
      .where(eq(productMedias.productId, productId));

    // Insertar las nuevas imágenes adicionales
    if (additionalImages && additionalImages.length > 0) {
      const productMediaRecords: InsertProductMedias[] = additionalImages
        .filter((mediaId) => mediaId && mediaId.trim() !== "")
        .map((mediaId, index) => ({
          productId,
          mediaId,
          priority: index + 1,
        }));

      if (productMediaRecords.length > 0) {
        await db.insert(productMedias).values(productMediaRecords);
      }
    }
  }

  revalidateStorefront();
  return insertedProduct;
};

export const getProductAdditionalImages = async (productId: string) => {
  await requireAdmin();
  return await db
    .select()
    .from(productMedias)
    .where(eq(productMedias.productId, productId))
    .orderBy(asc(productMedias.priority));
};

export const getProductsByIds = async (productIds: string[]) => {
  return await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));
};

export const deleteProductAction = async (productId: string) => {
  await requireAdmin();

  // Verificar si el producto tiene órdenes relacionadas
  const productOrders = await db
    .select()
    .from(orderLines)
    .where(eq(orderLines.productId, productId))
    .limit(1);

  if (productOrders.length > 0) {
    throw new Error(
      "No se puede eliminar el producto porque tiene órdenes asociadas. Las órdenes deben mantenerse para el historial de compras. Si necesitas ocultar el producto, considera marcarlo como no disponible o reduciendo el stock a 0.",
    );
  }

  // Primero eliminar las imágenes adicionales relacionadas
  await db.delete(productMedias).where(eq(productMedias.productId, productId));

  // Luego eliminar el producto
  // Nota: Los carritos (carts) se eliminarán automáticamente por CASCADE
  const deletedProduct = await db
    .delete(products)
    .where(eq(products.id, productId))
    .returning();

  revalidateStorefront();
  return deletedProduct;
};
