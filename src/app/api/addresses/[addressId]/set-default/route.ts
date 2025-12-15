import db from "@/lib/supabase/db";
import { address } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST - Marcar dirección como predeterminada
export async function POST(
  request: Request,
  { params }: { params: { addressId: string } },
) {
  try {
    const { addressId } = params;

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que la dirección pertenece al usuario
    const [existingAddress] = await db
      .select()
      .from(address)
      .where(
        and(eq(address.id, addressId), eq(address.userProfileId, user.id)),
      );

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Dirección no encontrada" },
        { status: 404 },
      );
    }

    // Desmarcar todas las direcciones del usuario
    await db
      .update(address)
      .set({ isDefault: false })
      .where(eq(address.userProfileId, user.id));

    // Marcar la dirección seleccionada como predeterminada
    const [updatedAddress] = await db
      .update(address)
      .set({
        isDefault: true,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(address.id, addressId), eq(address.userProfileId, user.id)))
      .returning();

    return NextResponse.json(
      {
        success: true,
        address: updatedAddress,
        message: "Dirección predeterminada actualizada",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      {
        error: "Error al establecer dirección predeterminada",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
