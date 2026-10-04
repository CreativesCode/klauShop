import { buttonVariants } from "@/components/ui/button";
import { DocumentType, gql } from "@/gql";
import { cn, keytoUrl } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
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
    <div className="relative w-full md:container-2xl mx-auto h-auto min-h-[320px] md:min-h-[400px] overflow-hidden mb-8">
      {/* Background Image */}
      <Image
        src={keytoUrl(featuredImage.key)}
        alt={featuredImage.alt}
        width={1440}
        height={500}
        sizes="100vw"
        className="absolute inset-0 object-center object-cover w-full h-full opacity-40"
      />

      {/* Content Overlay */}
      <div className="relative z-10 px-6 md:px-12 py-8 md:py-12">
        {/* Parent Collection Button */}
        {parentCollection && (
          <div className="mb-4">
            <Link
              href={`/collections/${parentCollection.slug}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2 bg-white/90 hover:bg-white hover:text-primary border-primary/20",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a {parentCollection.label}
            </Link>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-medium mb-4">{label}</h1>

        {/* Description */}
        {description && (
          <p className="text-foreground/90 text-sm md:text-base mb-6 max-w-2xl">
            {description}
          </p>
        )}

        {/* Subcollections */}
        {subcollections.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3">
              Subcategorías
            </h2>
            <div className="flex flex-wrap gap-2">
              {subcollections.map((edge) => (
                <Link
                  key={edge.node.id}
                  href={`/collections/${edge.node.slug}`}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "bg-white/90 hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm",
                  )}
                >
                  {edge.node.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionBanner;
export { CollectionBannerFragment };
