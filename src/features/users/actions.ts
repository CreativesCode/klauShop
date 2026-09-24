"use server";

import {
  AdminUserFormData,
  adminPhoneSchema,
} from "@/features/users/validations";
import db from "@/lib/supabase/db";
import {
  default as createClient,
  default as createServerClient,
} from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  address,
  carts,
  orders,
  profiles,
  wishlist,
} from "../../lib/supabase/schema";

export const getCurrentUser = async () => {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });

  const userResponse = await supabase.auth.getUser();
  return userResponse.data.user;
};
export const getCurrentUserSession = async () => {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });

  const userResponse = await supabase.auth.getSession();

  return userResponse.data.session;
};

export const isAdmin = (currentUser: User | null) =>
  currentUser?.app_metadata.isAdmin;

export const getProfilePhone = async (userId: string) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: { phone: true },
  });
  return profile?.phone ?? "";
};

// Admin-only: the phone that receives new-order WhatsApp notifications
export const updateAdminPhone = async (input: unknown) => {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdmin(currentUser)) {
    throw new Error("No autorizado.");
  }

  const parsed = adminPhoneSchema.safeParse(input);
  if (parsed.success === false) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos.");
  }

  await db
    .update(profiles)
    .set({ phone: parsed.data.phone || null })
    .where(eq(profiles.id, currentUser.id));

  return { success: true };
};

export const getUser = async ({ userId }: { userId: string }) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  try {
    const { data } = await adminAuthClient.getUserById(userId);
    return data;
  } catch (err) {
    throw new Error("There is an error");
  }
};

export const listUsers = async ({
  page = 1,
  perPage = 10,
}: {
  page?: number;
  perPage?: number;
}) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  const {
    data: { users },
  } = await adminAuthClient.listUsers({
    page,
    perPage,
  });
  return users;
};

export const createUser = async ({
  email,
  name,
  password,
}: AdminUserFormData) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  try {
    const existedUser = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });
    if (existedUser) throw new Error(`User with email ${email} is existed.`);

    const res = await adminAuthClient.createUser({
      email,
      password,
      role: "ADMIN",
      user_metadata: { name },
    });

    return res;
  } catch (err) {
    throw new Error("Unexpected error occured.");
  }
};

export const deleteUserAction = async (userId: string) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  try {
    // Verificar si el usuario tiene órdenes relacionadas
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .limit(1);

    if (userOrders.length > 0) {
      throw new Error(
        "No se puede eliminar el usuario porque tiene órdenes asociadas. Las órdenes deben mantenerse para el historial de compras.",
      );
    }

    // Eliminar carritos del usuario (si existen)
    await db.delete(carts).where(eq(carts.userId, userId));

    // Eliminar wishlist del usuario (si existe)
    await db.delete(wishlist).where(eq(wishlist.userId, userId));

    // Eliminar direcciones del usuario (si existen)
    await db.delete(address).where(eq(address.userProfileId, userId));

    // Eliminar el perfil del usuario si existe
    await db.delete(profiles).where(eq(profiles.id, userId));

    // Eliminar el usuario de Supabase Auth
    const { error } = await adminAuthClient.deleteUser(userId);

    if (error) {
      throw new Error(error.message || "Error al eliminar el usuario.");
    }

    return { success: true };
  } catch (err: any) {
    throw new Error(err?.message || "Error inesperado al eliminar el usuario.");
  }
};
