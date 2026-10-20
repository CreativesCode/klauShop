import AdminShell from "@/components/admin/AdminShell";
import { CollectionForm } from "@/features/collections/admin";
import { Suspense } from "react";

type Props = {};

async function NewProjectPage({}: Props) {
  return (
    <AdminShell
      heading="Nueva colección"
      description="Completa los datos y pulsa «Crear colección»."
      breadcrumb={[
        { label: "Colecciones", href: "/admin/collections" },
        { label: "Nueva" },
      ]}
    >
      {/* CollectionForm suspends on its urql query; without a boundary it refetched in a loop */}
      <Suspense>
        <CollectionForm />
      </Suspense>
    </AdminShell>
  );
}

export default NewProjectPage;
