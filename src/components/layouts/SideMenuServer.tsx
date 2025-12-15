import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { SideMenu } from "./SideMenu";
import type { Collection } from "./SideMenuCollections";

const SideMenuCollectionsQuery = gql(/* GraphQL */ `
  query SideMenuCollectionsQuery {
    collectionsCollection(orderBy: [{ order: DescNullsLast }]) {
      edges {
        node {
          id
          label
          slug
          title
          parent_id
          order
        }
      }
    }
  }
`);

export default async function SideMenuServer() {
  const { data } = await getServiceClient().query(SideMenuCollectionsQuery, {});

  const collections: Collection[] =
    data?.collectionsCollection?.edges?.map((edge) => ({
      id: edge.node.id,
      label: edge.node.label,
      slug: edge.node.slug,
      title: edge.node.title,
      parent_id: edge.node.parent_id,
      order: edge.node.order,
    })) || [];

  return <SideMenu collections={collections} />;
}
