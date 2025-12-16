import AdminShell from "@/components/admin/AdminShell";
import { ProductForm } from "@/features/products";
import db from "@/lib/supabase/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function NewProjectPage() {
  const products = await db.query.products.findMany();
  if (!products) return notFound();

  return (
    <AdminShell
      heading="Nuevo Producto"
      description="Ingrese los campos a continuación y presione el botón Agregar Producto para guardar el producto."
    >
      <Suspense>
        <ProductForm />
      </Suspense>
    </AdminShell>
  );
}

export default NewProjectPage;
