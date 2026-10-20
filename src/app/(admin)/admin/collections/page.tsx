import AdminShell from "@/components/admin/AdminShell";
import { Icons } from "@/components/layouts/icons";
import { buttonVariants } from "@/components/ui/button";
import { DataTableSkeleton } from "@/features/cms";
import {
  CollectionsColumns,
  CollectionsDataTable,
} from "@/features/collections/admin";
import { gql } from "@/gql";
import { getClient } from "@/lib/urql";
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
      description="Categorías de la tienda y lo que se muestra en el inicio."
      actions={
        <Link href="/admin/collections/new" className={buttonVariants()}>
          <Icons.add className="size-4" aria-hidden />
          Nueva colección
        </Link>
      }
    >
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
