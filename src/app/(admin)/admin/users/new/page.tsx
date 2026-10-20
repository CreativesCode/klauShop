import AdminShell from "@/components/admin/AdminShell";
import { AdminUserForm } from "@/features/users/admin";
import React from "react";

type Props = {};

function NewUserPage({}: Props) {
  return (
    <AdminShell
      heading="Nuevo usuario"
      description="Crea una cuenta con correo y contraseña."
      breadcrumb={[
        { label: "Usuarios", href: "/admin/users" },
        { label: "Nuevo" },
      ]}
    >
      <AdminUserForm />
    </AdminShell>
  );
}

export default NewUserPage;
