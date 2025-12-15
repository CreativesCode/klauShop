import { createClient } from "@/lib/supabase/client";
import { createId } from "@paralleldrive/cuid2";

export type CartItem = {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  created_at: string;
};

export type CreateCartItem = {
  product_id: string;
  user_id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
};

// Crear un item en el carrito
export async function createCartItem(data: CreateCartItem) {
  const supabase = createClient();
  const id = createId();

  const { data: cartItem, error } = await supabase
    .from("carts")
    .insert({
      id,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return cartItem as CartItem;
}

// Obtener items del carrito del usuario
export async function getCartItems(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("carts")
    .select(
      `
      *,
      product:products!cart_to_product (
        id,
        slug,
        name,
        price,
        discount,
        description,
        featuredImage:medias!featured_image (
          id,
          key,
          alt
        )
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

// Buscar si existe una combinación específica
export async function findCartItemByOptions(
  userId: string,
  productId: string,
  color?: string | null,
  size?: string | null,
  material?: string | null,
) {
  const supabase = createClient();

  let query = supabase
    .from("carts")
    .select()
    .eq("user_id", userId)
    .eq("product_id", productId);

  // Agregar filtros para las opciones
  if (color !== undefined) {
    query = color === null ? query.is("color", null) : query.eq("color", color);
  }
  if (size !== undefined) {
    query = size === null ? query.is("size", null) : query.eq("size", size);
  }
  if (material !== undefined) {
    query =
      material === null
        ? query.is("material", null)
        : query.eq("material", material);
  }

  const { data, error } = await supabase
    .from("carts")
    .select()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;

  // Filtrar manualmente por las opciones para asegurar coincidencia exacta
  const exactMatch = data?.find(
    (item) =>
      item.color === (color ?? null) &&
      item.size === (size ?? null) &&
      item.material === (material ?? null),
  );

  return exactMatch as CartItem | undefined;
}

// Actualizar cantidad de un item
export async function updateCartItemQuantity(id: string, quantity: number) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("carts")
    .update({ quantity })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CartItem;
}

// Eliminar un item del carrito
export async function deleteCartItem(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from("carts").delete().eq("id", id);

  if (error) throw error;
  return true;
}

// Limpiar todo el carrito del usuario
export async function clearUserCart(userId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("carts").delete().eq("user_id", userId);

  if (error) throw error;
  return true;
}

// Verificar stock disponible antes de agregar al carrito
export async function checkAvailableStock(
  productId: string,
  requestedQty: number,
  color?: string | null,
  size?: string | null,
  material?: string | null,
): Promise<{
  availableStock: number;
  hasStock: boolean;
  requestedQty: number;
}> {
  const response = await fetch("/api/inventory/check-stock", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId,
      requestedQty,
      color,
      size,
      material,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to check stock");
  }

  return response.json();
}
