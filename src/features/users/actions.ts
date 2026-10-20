"use server";

import {
  adminPhoneSchema,
  adminUserShcema,
  adminUserUpdateSchema,
} from "@/features/users/validations";
import { isAdmin } from "@/features/users/utils";
import db from "@/lib/supabase/db";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import {
  default as createClient,
  default as createServerClient,
} from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { User } from "@supabase/supabase-js";
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

export const getProfilePhone = async (userId: string) => {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.id !== userId && !isAdmin(currentUser))) {
    throw new Error("No autorizado.");
  }

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
  await requireAdmin();

  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  try {
    const { data } = await adminAuthClient.getUserById(userId);
    return data;
  } catch (err) {
    throw new Error("No se pudo cargar el usuario.");
  }
};

// Returns every auth user (the admin API pages at most 1000 per request)
export const listUsers = async () => {
  await requireAdmin();

  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  const perPage = 1000;
  const all: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await adminAuthClient.listUsers({ page, perPage });
    if (error) throw new Error("No se pudieron cargar los usuarios.");
    all.push(...data.users);
    if (data.users.length < perPage) break;
  }
  return all;
};

export const createUser = async (input: unknown) => {
  await requireAdmin();

  const parsed = adminUserShcema.safeParse(input);
  if (parsed.success === false) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos.");
  }
  const { email, name, password } = parsed.data;

  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  const existedUser = await db.query.profiles.findFirst({
    where: eq(profiles.email, email),
  });
  if (existedUser)
    throw new Error(`Ya existe un usuario con el correo ${email}.`);

  // Admin-created accounts are confirmed so they can sign in right away.
  // Admin rights are granted separately ("Hacer administrador" → app_metadata.isAdmin).
  const { data, error } = await adminAuthClient.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw new Error(error.message || "No se pudo crear el usuario.");

  return { id: data.user.id };
};

export const updateUserAction = async (userId: string, input: unknown) => {
  await requireAdmin();

  const parsed = adminUserUpdateSchema.safeParse(input);
  if (parsed.success === false) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos.");
  }
  const { email, name, password } = parsed.data;

  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  const { data: current, error: getError } =
    await adminAuthClient.getUserById(userId);
  if (getError || !current.user) throw new Error("Usuario no encontrado.");

  const { error } = await adminAuthClient.updateUserById(userId, {
    email,
    // Admin edits skip the confirmation email for the new address
    email_confirm: true,
    ...(password ? { password } : {}),
    user_metadata: { ...current.user.user_metadata, name },
  });
  if (error) throw new Error(error.message || "No se pudo actualizar.");

  // Keep the profile row (used by orders and notifications) in sync
  await db.update(profiles).set({ email, name }).where(eq(profiles.id, userId));

  return { success: true };
};

export const deleteUserAction = async (userId: string) => {
  await requireAdmin();

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
