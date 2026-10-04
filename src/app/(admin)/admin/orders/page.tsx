import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { DataTableSkeleton } from "@/features/cms";
import { OrdersColumns, OrdersDataTable } from "@/features/orders";
import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Admin data must always be fresh (no Data Cache snapshot when navigating)
export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

const AdminOrdersPageQuery = gql(/* GraphQL */ `
  query AdminOrdersPageQuery {
    ordersCollection(orderBy: [{ created_at: DescNullsLast }]) {
      edges {
        node {
          __typename
          id
          ...OrderColumnsFragment
        }
      }
    }
  }
`);

async function OrdersPage({}: AdminOrdersPageProps) {
  // Service role: orders are not readable with the anon key (RLS); the admin layout guards this page
  const { data } = await getServiceClient().query(AdminOrdersPageQuery, {});

  if (!data) return notFound();

  return (
    <AdminShell
      heading="Órdenes"
      description={"Edite las órdenes desde el dashboard. "}
    >
      <section className="flex justify-end items-center pb-5 w-full">
        <Link href="/admin/orders/new" className={cn(buttonVariants())}>
          Nueva Orden
        </Link>
      </section>

      <Suspense fallback={<DataTableSkeleton />}>
        <OrdersDataTable
          columns={OrdersColumns}
          data={data.ordersCollection.edges || []}
        />
      </Suspense>
    </AdminShell>
  );
}

export default OrdersPage;
