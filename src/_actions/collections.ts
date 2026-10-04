"use server";

import db from "@/lib/supabase/db";
import { revalidateStorefront } from "@/lib/revalidateStorefront";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import {
  InsertCollection,
  SelectCollection,
  collections,
  products,
} from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

export const createCollectionAction = async (
  data: InsertCollection,
): Promise<SelectCollection> => {
  await requireAdmin();

  const [createdCollection] = await db
    .insert(collections)
    .values({
      ...data,
      parentId: data.parentId || null,
      showInHome: data.showInHome || false,
    })
    .returning();

  if (!createdCollection) {
    throw new Error("Error al crear la colección.");
  }

  revalidateStorefront();
  return createdCollection;
};

export const updateCollectionAction = async (
  collectionId: string,
  data: Partial<InsertCollection>,
): Promise<SelectCollection> => {
  await requireAdmin();

  const [updatedCollection] = await db
    .update(collections)
    .set({
      ...data,
      parentId: data.parentId || null,
      showInHome: data.showInHome ?? false,
    })
    .where(eq(collections.id, collectionId))
    .returning();

  if (!updatedCollection) {
    throw new Error("No se encontró la colección para actualizar.");
  }

  revalidateStorefront();
  return updatedCollection;
};

export const deleteCollectionAction = async (collectionId: string) => {
  await requireAdmin();

  // Verificar si la colección tiene productos asociados
  const collectionProducts = await db
    .select()
    .from(products)
    .where(eq(products.collectionId, collectionId))
    .limit(1);

  if (collectionProducts.length > 0) {
    // No lanzamos error, solo informamos que los productos perderán la referencia
    // porque la relación tiene onDelete: "set null"
  }

  // Verificar si la colección tiene colecciones hijas
  const childCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.parentId, collectionId))
    .limit(1);

  if (childCollections.length > 0) {
    // No lanzamos error, solo informamos que las colecciones hijas perderán la referencia
    // porque la relación tiene onDelete: "set null"
  }

  // Eliminar la colección
  // Nota: Los productos y colecciones hijas perderán su referencia automáticamente (set null)
  const deletedCollection = await db
    .delete(collections)
    .where(eq(collections.id, collectionId))
    .returning();

  if (deletedCollection.length === 0) {
    throw new Error("No se encontró la colección para eliminar.");
  }

  revalidateStorefront();
  return deletedCollection;
};
