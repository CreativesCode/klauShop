import db from "@/lib/supabase/db";
import { shippingZones } from "@/lib/supabase/schema";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// A GET without request is prerendered at build time: zones would stay frozen until the next deploy
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const zones = await db
      .select({
        id: shippingZones.id,
        name: shippingZones.name,
        cost: shippingZones.cost,
      })
      .from(shippingZones)
      .where(eq(shippingZones.isActive, true))
      .orderBy(asc(shippingZones.name));

    return NextResponse.json({ zones }, { status: 200 });
  } catch (error) {
    console.error("Error loading shipping zones:", error);
    return NextResponse.json(
      { error: "Error cargando zonas de envío" },
      { status: 500 },
    );
  }
}
