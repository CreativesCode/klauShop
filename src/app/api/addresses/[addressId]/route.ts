import { addressSchema } from "@/features/addresses/validations";
import db from "@/lib/supabase/db";
import { address } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// PATCH - Actualizar dirección
export async function PATCH(
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

    const body = await request.json();
    const parsed = addressSchema.partial().safeParse(body);

    if (parsed.success === false) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { isDefault, ...addressData } = parsed.data;

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

    // Si se marca como predeterminada, desmarcar las demás
    if (isDefault) {
      await db
        .update(address)
        .set({ isDefault: false })
        .where(eq(address.userProfileId, user.id));
    }

    const [updatedAddress] = await db
      .update(address)
      .set({
        ...addressData,
        ...(isDefault !== undefined && { isDefault }),
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(address.id, addressId), eq(address.userProfileId, user.id)))
      .returning();

    return NextResponse.json(
      {
        success: true,
        address: updatedAddress,
        message: "Dirección actualizada exitosamente",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      {
        error: "Error al actualizar la dirección",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar dirección
export async function DELETE(
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

    // Eliminar la dirección
    await db
      .delete(address)
      .where(
        and(eq(address.id, addressId), eq(address.userProfileId, user.id)),
      );

    // Si era la dirección predeterminada, marcar otra como predeterminada
    if (existingAddress.isDefault) {
      const [firstAddress] = await db
        .select()
        .from(address)
        .where(eq(address.userProfileId, user.id))
        .limit(1);

      if (firstAddress) {
        await db
          .update(address)
          .set({ isDefault: true })
          .where(eq(address.id, firstAddress.id));
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Dirección eliminada exitosamente",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      {
        error: "Error al eliminar la dirección",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
