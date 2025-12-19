"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient({ cookieStore });

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Debes estar autenticado" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Bad Request", message: "No se proporcionó ningún archivo" },
        { status: 400 },
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "El archivo debe ser una imagen (png/jpg/webp)",
        },
        { status: 400 },
      );
    }

    // Validar tamaño (2MB máximo)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "La imagen es muy grande. Máximo 2MB",
        },
        { status: 400 },
      );
    }

    // Crear cliente con service role para bypassar RLS
    const supabaseAdmin = createClient({ cookieStore, isAdmin: true });

    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "";
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `public/avatars/${user.id}.${ext}`;

    // Convertir File a ArrayBuffer y luego a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo usando service role
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      return NextResponse.json(
        {
          error: "Upload Failed",
          message: uploadError.message,
        },
        { status: 500 },
      );
    }

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    const bustCacheUrl = `${publicUrl}?v=${Date.now()}`;

    // Actualizar avatar_url en el perfil del usuario
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          avatar_url: bustCacheUrl,
        },
      });

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      return NextResponse.json(
        {
          error: "Update Failed",
          message: updateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        avatarUrl: bustCacheUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "No se pudo subir la imagen";
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message,
      },
      { status: 500 },
    );
  }
}
