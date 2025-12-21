import { Shell } from "@/components/layouts/Shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getPageMetadata, getPageTitle, siteConfig } from "@/config/site";
import { CollectionBanner } from "@/features/collections";
import { SearchProductsGridSkeleton } from "@/features/products";
import {
  FilterSelections,
  SearchProductsInifiteScroll,
} from "@/features/search";
import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import {
  getURL,
  keytoUrl,
  stripHtml,
  toTitleCase,
  unslugify,
} from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: {
    collectionSlug: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const CollectionMetadataQuery = gql(/* GraphQL */ `
  query CollectionMetadataQuery($collectionSlug: String) {
    collectionsCollection(filter: { slug: { eq: $collectionSlug } }, first: 1) {
      edges {
        node {
          id
          title
          label
          description
          slug
          featuredImage: medias {
            id
            key
            alt
          }
        }
      }
    }
  }
`);

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const client = getServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.query(
    CollectionMetadataQuery as any,
    {
      collectionSlug: params.collectionSlug,
    } as any,
  );

  if (!result.data?.collectionsCollection?.edges[0]?.node) {
    const collectionTitle = toTitleCase(unslugify(params.collectionSlug));
    return getPageMetadata(collectionTitle);
  }

  const collection = result.data.collectionsCollection.edges[0].node;
  const baseUrl = getURL();
  const collectionUrl = `${baseUrl}collections/${collection.slug}`;
  const cleanDescription = stripHtml(collection.description || "");
  const metaDescription =
    cleanDescription.substring(0, 160) ||
    `${collection.label} - Explora nuestra colección de ${collection.label.toLowerCase()} en ${siteConfig.name}`;

  const imageUrl = collection.featuredImage?.key
    ? keytoUrl(collection.featuredImage.key)
    : undefined;

  return {
    title: getPageTitle(collection.label),
    description: metaDescription,
    openGraph: {
      title: `${collection.label} - ${siteConfig.name}`,
      description: metaDescription,
      url: collectionUrl,
      siteName: siteConfig.name,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: collection.featuredImage?.alt || collection.label,
            },
          ]
        : [
            {
              url: "https://bhwyagfoyylgrdgyngrm.supabase.co/storage/v1/object/public/klaushop/public/openGraph.jpg",
              width: 1200,
              height: 630,
              alt: siteConfig.name,
            },
          ],
      type: "website",
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: `${collection.label} - ${siteConfig.name}`,
      description: metaDescription,
      images: imageUrl
        ? [imageUrl]
        : [
            "https://bhwyagfoyylgrdgyngrm.supabase.co/storage/v1/object/public/klaushop/public/openGraph.jpg",
          ],
    },
    alternates: {
      canonical: collectionUrl,
    },
  };
}

const CollectionRouteQuery = gql(/* GraphQL */ `
  query CollectionRouteQuery($collectionSlug: String) {
    collectionsCollection(
      filter: { slug: { eq: $collectionSlug } }
      orderBy: [{ order: DescNullsLast }]
      first: 1
    ) {
      edges {
        node {
          id
          title
          label
          description
          ...CollectionBannerFragment
          productsCollection(orderBy: [{ created_at: DescNullsLast }]) {
            pageInfo {
              hasNextPage
            }
            edges {
              node {
                id
                ...ProductCardFragment
              }
            }
          }
        }
      }
    }
  }
`);

const GetChildCollectionsQuery = gql(/* GraphQL */ `
  query GetChildCollectionsQuery($parentId: String) {
    collectionsCollection(filter: { parent_id: { eq: $parentId } }) {
      edges {
        node {
          id
        }
      }
    }
  }
`);

// Helper function to recursively get all child collection IDs
async function getAllChildCollectionIds(
  collectionId: string,
  client: ReturnType<typeof getServiceClient>,
): Promise<string[]> {
  const childIds: string[] = [];

  const result = await client.query(GetChildCollectionsQuery, {
    parentId: collectionId,
  });

  const directChildren =
    result.data?.collectionsCollection?.edges.map((edge) => edge.node.id) || [];

  childIds.push(...directChildren);

  // Recursively get children of children
  for (const childId of directChildren) {
    const grandChildren = await getAllChildCollectionIds(childId, client);
    childIds.push(...grandChildren);
  }

  return childIds;
}

async function CategoryPage({ params }: CategoryPageProps) {
  const { collectionSlug } = params;

  const client = getServiceClient();
  const collectionResult = await client.query(CollectionRouteQuery, {
    collectionSlug,
  });

  if (
    collectionResult.data === null ||
    !collectionResult.data?.collectionsCollection?.edges[0]?.node ||
    collectionResult.data?.collectionsCollection === null ||
    collectionResult.data?.collectionsCollection?.edges[0].node
      .productsCollection === null
  )
    return notFound();

  const collection = collectionResult.data.collectionsCollection.edges[0].node;
  const productsList = collection.productsCollection;

  if (!productsList) return notFound();

  // Get all child collection IDs recursively
  const childCollectionIds = await getAllChildCollectionIds(
    collection.id,
    client,
  );

  // Combine main collection ID with all child collection IDs
  const allCollectionIds = [collection.id, ...childCollectionIds];

  return (
    <Shell className="max-w-screen-2xl mx-auto">
      <CollectionBanner collectionBannerData={collection} />
      <Suspense
        fallback={
          <div>
            <Skeleton className="max-w-xl h-8 mb-3" />
            <Skeleton className="max-w-2xl h-8" />
          </div>
        }
      >
        <FilterSelections shopLayout={false} />
      </Suspense>

      <Suspense fallback={<SearchProductsGridSkeleton />}>
        <SearchProductsInifiteScroll collectionIds={allCollectionIds} />
      </Suspense>
    </Shell>
  );
}

export default CategoryPage;
