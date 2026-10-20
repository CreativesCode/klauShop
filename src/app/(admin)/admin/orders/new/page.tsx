import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import AdminOrderCreateForm from "@/features/orders/components/admin/AdminOrderCreateForm";
import db from "@/lib/supabase/db";
import { inventoryReservations, products } from "@/lib/supabase/schema";
import { and, asc, eq, sql } from "drizzle-orm";
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
      // Same rule as the checkout: physical stock minus active reservations
      reserved: sql<number>`coalesce(sum(${inventoryReservations.quantity}), 0)::int`,
    })
    .from(products)
    .leftJoin(
      inventoryReservations,
      and(
        eq(inventoryReservations.productId, products.id),
        eq(inventoryReservations.status, "active"),
      ),
    )
    .groupBy(products.id)
    .orderBy(asc(products.name));

  return (
    <AdminShell
      heading="Nueva orden"
      description="Registra un pedido que llegó por WhatsApp o en persona."
      breadcrumb={[
        { label: "Órdenes", href: "/admin/orders" },
        { label: "Nueva" },
      ]}
    >
      <AdminOrderCreateForm
        products={productsData.map(({ reserved, ...p }) => ({
          ...p,
          available: Math.max(0, (p.stock ?? 0) - Number(reserved)),
        }))}
      />
    </AdminShell>
  );
}
