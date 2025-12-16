import { getProductAdditionalImages } from "@/_actions/products";
import AdminShell from "@/components/admin/AdminShell";
import { ProductForm } from "@/features/products";
import db from "@/lib/supabase/db";
import { products } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type EditProjectPageProps = {
  params: {
    productId: string;
  };
};

async function EditProjectPage({
  params: { productId },
}: EditProjectPageProps) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });
  if (!product) return notFound();

  const additionalImages = await getProductAdditionalImages(productId);

  return (
    <AdminShell
      heading="Editar Producto"
      description="Ingrese los campos a continuación y presione el botón Actualizar Producto para guardar el producto."
    >
      <Suspense>
        <ProductForm
          product={product}
          initialAdditionalImages={additionalImages.map((img) => img.mediaId)}
        />
      </Suspense>
    </AdminShell>
  );
}

export default EditProjectPage;
