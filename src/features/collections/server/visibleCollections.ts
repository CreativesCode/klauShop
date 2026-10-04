import "server-only";

import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";

type CollectionLike = { id: string };

// Reads go through pg_graphql (project rule); max_rows is 1000, enough for the catalog
const VisibleCollectionsQuery = gql(/* GraphQL */ `
  query VisibleCollectionsQuery {
    productsCollection(filter: { stock: { gt: 0 } }, first: 1000) {
      edges {
        node {
          collection_id
        }
      }
    }
    collectionsCollection(first: 1000) {
      edges {
        node {
          id
          parent_id
        }
      }
    }
  }
`);

/**
 * Store menus only list collections with something to buy: the collection itself or one
 * of its sub-collections has a product in stock. Empty ones (or still being prepared) stay hidden.
 * If the check fails, every collection is shown (a menu must never disappear).
 */
export async function filterVisibleCollections<T extends CollectionLike>(
  collections: T[],
): Promise<T[]> {
  const { data, error } = await getServiceClient().query(
    VisibleCollectionsQuery,
    {},
  );
  if (!data?.productsCollection || !data.collectionsCollection) {
    console.error("Visible collections check failed:", error?.message);
    return collections;
  }

  const visible = new Set<string>();
  for (const { node } of data.productsCollection.edges) {
    if (node.collection_id) visible.add(node.collection_id);
  }

  // Parents of non-empty collections are visible too (walk up the tree)
  const parentOf = new Map(
    data.collectionsCollection.edges.map(({ node }) => [
      node.id,
      node.parent_id ?? null,
    ]),
  );
  for (const id of Array.from(visible)) {
    let parent = parentOf.get(id) ?? null;
    while (parent && !visible.has(parent)) {
      visible.add(parent);
      parent = parentOf.get(parent) ?? null;
    }
  }

  return collections.filter((c) => visible.has(c.id));
}
