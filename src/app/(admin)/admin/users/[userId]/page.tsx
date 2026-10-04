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
      heading="Actualizar Usuario"
      description="Edite el usuario por admin."
      showBackButton={true}
    >
      <UpdateUserForm user={user} />
    </AdminShell>
  );
}

export default UpdateUserPage;
