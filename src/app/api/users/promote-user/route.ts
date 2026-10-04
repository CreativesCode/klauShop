import { PromoteAdminSchema, promoteAdminSchema } from "@/features/users";
import createClient from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  // Primero autenticar con cliente normal (lee cookies)
  const supabase = createClient({ cookieStore });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Verificar que el usuario esté autenticado
  if (authError || !user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  // Verificar que el usuario sea admin
  if (!user.app_metadata?.isAdmin) {
    return NextResponse.json(
      { message: "Solo administradores pueden realizar esta acción" },
      { status: 403 },
    );
  }

  // Crear cliente admin para operaciones privilegiadas
  const adminClient = createClient({ cookieStore, isAdmin: true });

  const data: PromoteAdminSchema = await request.json();
  const validate = promoteAdminSchema.safeParse(data);

  if (!validate.success) {
    return NextResponse.json(
      { message: "Error, validación de datos fallida" },
      { status: 400 },
    );
  }

  const { data: userResponse } = await adminClient.auth.admin.getUserById(
    validate.data.userId,
  );

  if (!userResponse.user)
    return NextResponse.json(
      { message: `Error, UserId: ${validate.data.userId} no encontrado` },
      { status: 404 },
    );

  const { data: updatedUser, error } =
    await adminClient.auth.admin.updateUserById(validate.data.userId, {
      app_metadata: { isAdmin: true },
    });

  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });

  return NextResponse.json(
    {
      message: `User:${updatedUser.user.user_metadata.name} is promoted to Admin.`,
    },
    { status: 201 },
  );
}
