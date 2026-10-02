"use server";

import { env } from "@/env.mjs";
import { uploadImage } from "@/lib/s3";
import db from "@/lib/supabase/db";
import { medias } from "@/lib/supabase/schema";
import { mediaSchema } from "@/validations/medias";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";

export async function POST(request: NextRequest) {
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
      { message: "No tienes permiso para subir imágenes." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData) as z.infer<typeof mediaSchema>;
  const validation = mediaSchema.safeParse(data);

  if (validation.success === false) {
    return NextResponse.json(
      { message: validation.error.issues[0]?.message ?? "Archivo inválido." },
      { status: 400 },
    );
  }

  try {
    const ids = await Promise.all(
      Object.values(data).map(async (file) => {
        const fileExtension = file.type.split("/")[1];
        const key = nanoid() + "." + fileExtension;

        const params = {
          Bucket: env.NEXT_PUBLIC_S3_BUCKET,
          Key: "public/" + key,
          Body: Buffer.from(await file.arrayBuffer()),
          ContentType: file.type,
        };

        await uploadImage(params);

        const [insertedMedia] = await db
          .insert(medias)
          .values({ alt: file.name, key: params.Key })
          .returning({ id: medias.id });

        return insertedMedia.id;
      }),
    );

    return NextResponse.json({ ids }, { status: 201 });
  } catch (err) {
    console.error("Error uploading media:", err);
    return NextResponse.json(
      { message: "No se pudo guardar la imagen en el almacenamiento." },
      { status: 500 },
    );
  }
}

const fileToStream = async (file: File) => {
  // Upload Image to S3 bucket
  const mimeType = file.type;
  const buffer = Buffer.from(await file.arrayBuffer());

  const imageBuffer = await sharp(buffer);
  const metadata = await imageBuffer.metadata();

  if (mimeType !== "image/gif")
    return {
      mimeType: "image/webp",
      buffer: await sharp(buffer).webp().toBuffer(),
    };

  return {
    mimeType: "image/gif",
    buffer,
  };
};
