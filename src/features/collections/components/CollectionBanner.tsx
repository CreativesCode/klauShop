import { DocumentType, gql } from "@/gql";
import { keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const CollectionBannerFragment = gql(/* GraphQL */ `
  fragment CollectionBannerFragment on collections {
    id
    label
    slug
    description
    parent_id
    featuredImage: medias {
      id
      key
      alt
    }
    collections {
      id
      label
      slug
    }
    collectionsCollection(orderBy: [{ order: DescNullsLast }]) {
      edges {
        node {
          id
          label
          slug
          title
        }
      }
    }
  }
`);

function CollectionBanner({
  collectionBannerData,
}: {
  collectionBannerData: DocumentType<typeof CollectionBannerFragment>;
}) {
  const {
    label,
    description,
    featuredImage,
    collections: parentCollection,
    collectionsCollection,
  } = collectionBannerData;

  const subcollections = collectionsCollection?.edges || [];

  return (
    <div className="flex flex-col gap-3">
      {parentCollection && (
        <nav
          aria-label="Ruta"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500"
        >
          <Link href="/" className="hover:text-primary-700">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/collections/${parentCollection.slug}`}
            className="hover:text-primary-700"
          >
            {parentCollection.label}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-ink">{label}</span>
        </nav>
      )}

      <section className="relative flex min-h-[clamp(220px,26vw,340px)] items-end overflow-hidden rounded-4xl bg-primary-950">
        <Image
          src={keytoUrl(featuredImage.key)}
          alt={featuredImage.alt || label}
          fill
          priority
          sizes="(max-width: 1320px) 100vw, 1320px"
          className="object-cover object-center"
        />
        <span
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,.1)_20%,rgba(17,24,39,.78)_100%)]"
          aria-hidden
        />
        <div className="relative flex max-w-2xl flex-col gap-3 p-[clamp(22px,3vw,36px)] text-white">
          <h1 className="font-display text-[clamp(40px,4.4vw,60px)] leading-none">
            {label}
          </h1>
          {description && (
            <p className="text-[15px] leading-[1.55] text-white/90">
              {description}
            </p>
          )}
          {subcollections.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {subcollections.map((edge) => (
                <Link
                  key={edge.node.id}
                  href={`/collections/${edge.node.slug}`}
                  className="inline-flex h-9 items-center rounded-full bg-white/90 px-3.5 text-[13px] font-bold text-ink backdrop-blur transition-colors hover:bg-white"
                >
                  {edge.node.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default CollectionBanner;
export { CollectionBannerFragment };
