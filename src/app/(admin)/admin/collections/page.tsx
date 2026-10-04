import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { DataTableSkeleton } from "@/features/cms";
import {
  CollectionsColumns,
  CollectionsDataTable,
} from "@/features/collections";
import { gql } from "@/gql";
import { getClient } from "@/lib/urql";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Admin data must always be fresh (no Data Cache snapshot when navigating)
export const dynamic = "force-dynamic";

type AdminCollectionsPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

const AdminCollectionsPageQuery = gql(/* GraphQL */ `
  query AdminCollectionsPageQuery {
    collectionsCollection(orderBy: [{ title: AscNullsLast }]) {
      edges {
        node {
          __typename
          id
          ...CollectionColumnsFragment
        }
      }
    }
  }
`);

async function collectionsPage({}: AdminCollectionsPageProps) {
  const { data } = await getClient().query(AdminCollectionsPageQuery, {});

  if (!data) return notFound();

  return (
    <AdminShell
      heading="Colecciones"
      description={"Edite las colecciones desde el dashboard. "}
    >
      <section className="flex justify-end items-center pb-5 w-full">
        <Link href="/admin/collections/new" className={cn(buttonVariants())}>
          Nueva Colección
        </Link>
      </section>

      <Suspense fallback={<DataTableSkeleton />}>
        <CollectionsDataTable
          columns={CollectionsColumns}
          data={data.collectionsCollection?.edges || []}
        />
      </Suspense>
    </AdminShell>
  );
}

export default collectionsPage;
