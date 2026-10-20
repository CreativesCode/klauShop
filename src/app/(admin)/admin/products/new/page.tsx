import AdminShell from "@/components/admin/AdminShell";
import { ProductForm } from "@/features/products/admin";
import db from "@/lib/supabase/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function NewProjectPage() {
  const products = await db.query.products.findMany();
  if (!products) return notFound();

  return (
    <AdminShell
      heading="Nuevo producto"
      description="Completa los datos y pulsa «Crear producto» para publicarlo."
      breadcrumb={[
        { label: "Productos", href: "/admin/products" },
        { label: "Nuevo" },
      ]}
    >
      <Suspense>
        <ProductForm />
      </Suspense>
    </AdminShell>
  );
}

export default NewProjectPage;
