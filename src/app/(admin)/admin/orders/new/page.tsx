import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import AdminOrderCreateForm from "@/features/orders/components/admin/AdminOrderCreateForm";
import db from "@/lib/supabase/db";
import { products } from "@/lib/supabase/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminNewOrderPage() {
  const productsData = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      discount: products.discount,
      stock: products.stock,
      colors: products.colors,
      sizes: products.sizes,
      materials: products.materials,
    })
    .from(products)
    .orderBy(asc(products.name));

  return (
    <AdminShell
      heading="Nueva Orden"
      description="Crea una orden manualmente desde el dashboard (WhatsApp)."
    >
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="outline">Volver a órdenes</Button>
        </Link>
      </div>

      <AdminOrderCreateForm products={productsData} />
    </AdminShell>
  );
}
