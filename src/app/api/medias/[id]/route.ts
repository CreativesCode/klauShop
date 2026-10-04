import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import db from "@/lib/supabase/db";
import { medias } from "@/lib/supabase/schema";
import { deleteImage } from "@/lib/s3";
import { getMediaUsage } from "@/features/medias/server/getMediaUsage";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Tu sesión expiró. Vuelve a iniciar sesión." },
      { status: 401 },
    );
  }

  if (!user.app_metadata?.isAdmin) {
    return NextResponse.json(
      { message: "No tienes permiso para eliminar imágenes." },
      { status: 403 },
    );
  }

  try {
    const media = await db.query.medias.findFirst({
      where: eq(medias.id, params.id),
    });

    if (!media) {
      return NextResponse.json(
        { message: "La imagen ya no existe." },
        { status: 404 },
      );
    }

    const usage = await getMediaUsage(media.id);
    const featuredIn = [
      ...usage.featuredInProducts,
      ...usage.featuredInCollections,
    ];

    if (featuredIn.length > 0) {
      return NextResponse.json(
        {
          message: `Es la imagen principal de: ${featuredIn.join(", ")}. Cámbiala allí antes de eliminarla.`,
        },
        { status: 409 },
      );
    }

    // Gallery links (product_medias) cascade with the row.
    await db.delete(medias).where(eq(medias.id, media.id));

    // A leftover file in the bucket is harmless; a dangling DB row is not, so DB goes first.
    try {
      await deleteImage(media.key);
    } catch (err) {
      console.error("Media row deleted but storage object remains:", err);
    }

    return NextResponse.json({ id: media.id }, { status: 200 });
  } catch (err) {
    console.error("Error deleting media:", err);
    return NextResponse.json(
      { message: "No se pudo eliminar la imagen. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
