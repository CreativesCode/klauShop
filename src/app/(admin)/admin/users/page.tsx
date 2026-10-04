import AdminShell from "@/components/admin/AdminShell";
import ErrorToaster from "@/components/layouts/ErrorToaster";
import { getCurrentUser, listUsers } from "@/features/users";
import {
  AdminUserNav,
  UsersColumns,
  UsersDataTable,
} from "@/features/users/admin";

type AdminUsersPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

async function UsersPage({ searchParams }: AdminUsersPageProps) {
  const users = await listUsers({});

  return (
    <AdminShell
      heading="Usuarios"
      description="Edite/Cree nuevos usuarios por admin."
    >
      <AdminUserNav />
      <UsersDataTable columns={UsersColumns} data={users || []} />
      <ErrorToaster />
    </AdminShell>
  );
}

export default UsersPage;
