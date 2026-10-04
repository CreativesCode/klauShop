import AdminShell from "@/components/admin/AdminShell";
import { gql } from "@/gql";
import { getClient } from "@/lib/urql";

import { notFound } from "next/navigation";
import { CollectionForm } from "@/features/collections";
import { Suspense } from "react";

// Admin data must always be fresh (no Data Cache snapshot when navigating)
export const dynamic = "force-dynamic";

type EditCollectionPageProps = {
  params: {
    collectionId: string;
  };
};

const updateCollectionPageQuery = gql(/* GraphQL */ `
  query UPDATE_COLLECTION_PAGE_QUERY($collectionId: String) {
    collectionsCollection(filter: { id: { eq: $collectionId } }, first: 1) {
      edges {
        node {
          __typename
          id
          ...CollectionFromFragment
        }
      }
    }
  }
`);

async function EditCollectionPage({
  params: { collectionId },
}: EditCollectionPageProps) {
  const { data } = await getClient().query(updateCollectionPageQuery, {
    collectionId,
  });
  if (!data || !data?.collectionsCollection?.edges[0]) return notFound();

  return (
    <AdminShell
      heading="Editar Colección"
      description="Modifique los campos y presione el botón para guardar la colección."
    >
      <div className="">
        {/* CollectionForm suspends on its urql query; without a boundary it refetched in a loop */}
        <Suspense>
          <CollectionForm
            collection={data.collectionsCollection.edges[0].node}
          />
        </Suspense>
      </div>
    </AdminShell>
  );
}

export default EditCollectionPage;
