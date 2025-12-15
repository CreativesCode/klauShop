import { addressSchema } from "@/features/addresses/validations";
import db from "@/lib/supabase/db";
import { address } from "@/lib/supabase/schema";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET - Obtener todas las direcciones del usuario autenticado
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const addresses = await db
      .select()
      .from(address)
      .where(eq(address.userProfileId, user.id))
      .orderBy(desc(address.isDefault), desc(address.createdAt));

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      {
        error: "Error al obtener las direcciones",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// POST - Crear nueva dirección
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);

    if (parsed.success === false) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const addressData = parsed.data;
    const { isDefault, ...addressFields } = addressData;

    // Si es la dirección predeterminada, desmarcar las demás
    if (isDefault) {
      await db
        .update(address)
        .set({ isDefault: false })
        .where(eq(address.userProfileId, user.id));
    }

    // Si es la primera dirección, hacerla predeterminada automáticamente
    const existingAddresses = await db
      .select()
      .from(address)
      .where(eq(address.userProfileId, user.id));

    const shouldBeDefault = isDefault || existingAddresses.length === 0;

    const [newAddress] = await db
      .insert(address)
      .values({
        name: addressFields.name,
        recipientName: addressFields.recipientName,
        phone: addressFields.phone,
        zone: addressFields.zone,
        fullAddress: addressFields.fullAddress || null,
        notes: addressFields.notes || null,
        userProfileId: user.id,
        isDefault: shouldBeDefault,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        address: newAddress,
        message: "Dirección creada exitosamente",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      {
        error: "Error al crear la dirección",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
