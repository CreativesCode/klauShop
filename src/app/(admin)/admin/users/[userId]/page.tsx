import AdminShell from "@/components/admin/AdminShell";
import { getUser } from "@/features/users";
import { UpdateUserForm } from "@/features/users/admin";
import { notFound } from "next/navigation";

type UpdateUserPageProps = { params: { userId: string } };

async function UpdateUserPage({ params: { userId } }: UpdateUserPageProps) {
  const { user } = await getUser({ userId });
  if (!user) return notFound();

  return (
    <AdminShell
      heading="Editar usuario"
      description="Nombre, correo y contraseña de la cuenta."
      breadcrumb={[
        { label: "Usuarios", href: "/admin/users" },
        { label: user.email ?? "Usuario" },
      ]}
    >
      <UpdateUserForm user={user} />
    </AdminShell>
  );
}

export default UpdateUserPage;
