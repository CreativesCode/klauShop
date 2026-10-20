import AdminShell from "@/components/admin/AdminShell";
import ErrorToaster from "@/components/layouts/ErrorToaster";
import { Icons } from "@/components/layouts/icons";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser, listUsers } from "@/features/users";
import { UsersColumns, UsersDataTable } from "@/features/users/admin";

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
      description="Clientes registrados y administradores de la tienda."
      actions={
        <Link href="/admin/users/new" className={buttonVariants()}>
          <Icons.add className="size-4" aria-hidden />
          Nuevo usuario
        </Link>
      }
    >
      <UsersDataTable columns={UsersColumns} data={users || []} />
      <ErrorToaster />
    </AdminShell>
  );
}

export default UsersPage;
