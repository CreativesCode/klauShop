import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { DataTableSkeleton } from "@/features/cms";
import {
  ExportProductsButton,
  ProductsColumns,
  ProductsDataTable,
} from "@/features/products";
import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Force dynamic rendering to avoid cache issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminProjectsPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

async function ProductsPage({ searchParams }: AdminProjectsPageProps) {
  const stockParamRaw = searchParams?.stock;
  const stockParam = Array.isArray(stockParamRaw)
    ? stockParamRaw[0]
    : stockParamRaw;

  const initialStockFilter =
    stockParam === "out" ||
    stockParam === "low" ||
    stockParam === "in" ||
    stockParam === "all"
      ? stockParam
      : "all";

  const AdminProductsPageQuery = gql(/* GraphQL */ `
    query AdminProductsPageQuery {
      productsCollection(
        first: 1000
        orderBy: [{ created_at: DescNullsLast }]
      ) {
        edges {
          node {
            id
            ...ProductColumnFragment
          }
        }
      }
    }
  `);

  const { data } = await getServiceClient().query(
    AdminProductsPageQuery,
    {},
    { requestPolicy: "network-only" },
  );

  if (!data) return notFound();

  return (
    <AdminShell
      heading="Productos"
      description={"Editar productos desde el dashboard. "}
    >
      <section className="flex justify-end items-center gap-3 pb-5 w-full">
        <ExportProductsButton products={data.productsCollection?.edges || []} />
        <Link href="/admin/products/new" className={cn(buttonVariants())}>
          Nuevo Producto
        </Link>
      </section>

      <Suspense fallback={<DataTableSkeleton />}>
        <ProductsDataTable
          columns={ProductsColumns}
          data={data.productsCollection?.edges || []}
          initialStockFilter={initialStockFilter}
        />
      </Suspense>
    </AdminShell>
  );
}

export default ProductsPage;
