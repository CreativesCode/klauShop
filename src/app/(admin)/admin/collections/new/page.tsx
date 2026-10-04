import AdminShell from "@/components/admin/AdminShell";
import { CollectionForm } from "@/features/collections/admin";
import { Suspense } from "react";

type Props = {};

async function NewProjectPage({}: Props) {
  return (
    <AdminShell
      heading="Agregar Colección"
      description="Ingrese los campos a continuación, después de eso presione el botón Agregar Colección para guardar la colección."
    >
      {/* CollectionForm suspends on its urql query; without a boundary it refetched in a loop */}
      <Suspense>
        <CollectionForm />
      </Suspense>
    </AdminShell>
  );
}

export default NewProjectPage;
