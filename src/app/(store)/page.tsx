import { Shell } from "@/components/layouts/Shell";
import { Icons } from "@/components/layouts/icons";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata, siteConfig } from "@/config/site";
import { CollectionCardFragment } from "@/features/collections";
import {
  ProductCard,
  ProductCardFragment,
  ProductCardSkeleton,
} from "@/features/products";
import { getCurrentUser } from "@/features/users/actions";
import { DocumentType, gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { cn, keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = getPageMetadata(
  "Inicio",
  "Tu tienda favorita de ropa y accesorios. Moda para el día a día con envíos a domicilio en Santa Clara, Placetas, Encrucijada y Calabazar de Sagua.",
);

// This route must run on every request so we can handle Supabase email redirects
// like `/?code=...` and forward them to `/auth/callback`.
export const dynamic = "force-dynamic";
const LandingRouteQuery = gql(/* GraphQL */ `
  query LandingRouteQuery($user_id: UUID) {
    products: productsCollection(
      filter: { featured: { eq: true } }
      first: 4
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }

    sliderProducts: productsCollection(
      filter: { show_in_slider: { eq: true } }
      first: 20
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }

    wishlistCollection(filter: { user_id: { eq: $user_id } }) {
      edges {
        node {
          product_id
        }
      }
    }

    cartsCollection(filter: { user_id: { eq: $user_id } }) {
      edges {
        node {
          product_id
          quantity
        }
      }
    }

    collectionScrollCards: collectionsCollection(
      filter: { show_in_home: { eq: true } }
      first: 6
      orderBy: [{ order: DescNullsLast }]
    ) {
      edges {
        node {
          id
          ...CollectionCardFragment
        }
      }
    }
  }
`);

export default async function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // If a Supabase email link lands on the home page, forward it to our callback
  // route to exchange the code/otp and then redirect accordingly.
  const codeParam = searchParams?.code;
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  const tokenHashParam = searchParams?.token_hash;
  const token_hash = Array.isArray(tokenHashParam)
    ? tokenHashParam[0]
    : tokenHashParam;
  const typeParam = searchParams?.type;
  const type = Array.isArray(typeParam) ? typeParam[0] : typeParam;
  const nextParam = searchParams?.next;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  // Prefer explicit hints (`next` or `type=recovery`) to choose where to continue.
  // If Supabase lands us on `/?code=...` without any extra hint, default to the
  // password reset UI (this is the common case for recovery links).
  const targetNext =
    next || (type === "recovery" || code ? "/sign-in/reset-password" : "/");

  if (code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(
        targetNext,
      )}`,
    );
  }

  if (token_hash && type) {
    redirect(
      `/auth/callback?token_hash=${encodeURIComponent(
        token_hash,
      )}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(
        targetNext,
      )}`,
    );
  }

  const currentUser = await getCurrentUser();

  const { data } = await getServiceClient().query(LandingRouteQuery, {
    user_id: currentUser?.id,
  });

  if (data === null) return notFound();

  const sliderInStock = (data.sliderProducts?.edges ?? []).filter(
    ({ node }) => (node.stock ?? 0) > 0,
  );

  function ProductSubCollectionsCircles({
    collections,
  }: CollectionsCardsProps) {
    return (
      <section className="flex justify-start md:justify-center items-center gap-x-6 md:gap-x-10 overflow-x-auto py-12 px-6 md:px-8">
        {collections.map(({ node }) => (
          <Link
            href={`/collections/${node.slug}`}
            key={`collection_circle_${node.id}`}
            className="flex-shrink-0"
          >
            <div
              className={cn(
                "relative bg-secondary rounded-full flex justify-center items-center overflow-hidden shadow-md",
                "w-[180px] h-[180px]",
                "md:w-[240px] md:h-[240px]",
                // "md:w-[320px] md:h-[320px]"
                // "lg:w-[360px] lg:h-[360px]"
              )}
            >
              <Image
                src={keytoUrl(node.featuredImage.key)}
                alt={node.featuredImage.alt}
                width={320}
                height={320}
                className={cn(
                  "object-center object-cover hover:scale-105 transition-all duration-500 rounded-full",
                  "w-[180px] h-[180px]",
                  "md:w-[240px] md:h-[240px]",
                  // "md:w-[280px] md:h-[280px]",
                  // "lg:w-[320px] lg:h-[320px]"
                )}
              />
            </div>
            <p className="text-black text-center mt-3 font-semibold">
              {node.label}
            </p>
          </Link>
        ))}
      </section>
    );
  }

  return (
    <main>
      <HeroSection />

      <Shell className="max-w-screen-2xl mx-auto">
        {data.products && data.products.edges ? (
          <ProductSubCollectionsCircles
            collections={data.collectionScrollCards.edges}
          />
        ) : null}

        {sliderInStock.length > 0 ? (
          <FeaturedProductsCards
            products={sliderInStock}
            title="Te encantarán"
            description="Productos que te encantarán si te gusta la moda casual y urbana."
          />
        ) : null}
        {/* <CollectionGrid /> */}

        <BannerCollectionCard
          imageSrc="https://bhwyagfoyylgrdgyngrm.supabase.co/storage/v1/object/public/klaushop/public/banner-cupboard.jpg"
          title="Esenciales."
          description="Simplifica tu día a día con nuestro armario cápsula. Prendas versátiles de alta calidad que combinan entre sí sin esfuerzo, permitiéndote vestirte con elegancia y consciencia en minutos."
          ctatext="Explorar Ropa"
          collectionHref="/collections/cupboard"
          imageLeft={false}
        />

        {/* {sliderInStock.length > 0 ? (
          // <Suspense fallback={<ProductSliderSkeleton />}>
          <ProductSlider
            products={sliderInStock}
            title="Productos Destacados"
          />
        ) : // </Suspense>
        null} */}
        {data.products && data.products.edges ? (
          <FeaturedProductsCards
            products={data.products.edges}
            title="Productos Destacados"
            description="Productos destacados para tu día a día."
          />
        ) : null}

        <DifferentFeatureCards />

        <BannerCollectionCard
          imageSrc="https://bhwyagfoyylgrdgyngrm.supabase.co/storage/v1/object/public/klaushop/public/banner-swimwear.jpg"
          title="Verano."
          description="Creemos que el estilo de playa no debe ser complicado. Diseños atemporales, tejidos sostenibles y cortes que realzan tu belleza natural, hechos para durar más allá de una temporada."
          ctatext="Ver Colección Playa"
          collectionHref="/collections/swimwear"
          imageLeft={true}
        />
      </Shell>
    </main>
  );
}

function HeroSection() {
  return (
    <section className="w-full h-[500px] sm:h-[600px] md:h-[800px] mx-auto flex justify-center">
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[800px]">
        <Image
          alt="Furniture"
          src="https://bhwyagfoyylgrdgyngrm.supabase.co/storage/v1/object/public/klaushop/public/bg-hero.jpg"
          priority={true}
          width={1920}
          height={800}
          quality={75}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="max-w-screen-2xl mx-auto absolute py-8 h-[500px] sm:h-[600px] md:h-[800px] w-full">
        <div className="flex flex-col justify-center z-30 h-full container px-4 sm:px-6">
          <p className="text-xs sm:text-sm md:text-base uppercase tracking-wider sm:tracking-widest text-white">
            {siteConfig.name}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl xl:text-9xl font-bold text-white my-3 sm:my-4 leading-tight">
            Moda para
            <br />
            el día a día.
          </h1>
          <p className="text-xs sm:text-sm md:text-base tracking-wide sm:tracking-widest text-white mb-3 sm:mb-4">
            Envíos en {siteConfig.zones} • Encargos Shein/Temu/Amazon.
          </p>

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-4 sm:mt-5 max-w-screen">
            <Link
              href="/shop"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-2 border-white text-white rounded px-6 py-2.5 text-sm",
                "sm:px-8 sm:py-3",
                "md:px-12 md:py-4 md:text-base",
                "lg:px-16 lg:py-6 lg:text-lg",
                "hover:text-zinc-600 hover:bg-white w-full sm:w-auto text-center",
              )}
            >
              Nuevos productos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeaturedProductsCards {
  products: { node: DocumentType<typeof ProductCardFragment> }[];
}

interface CollectionsCardsProps {
  collections: { node: DocumentType<typeof CollectionCardFragment> }[];
}

interface FeaturedProductsCardsProps {
  products: { node: DocumentType<typeof ProductCardFragment> }[];
  title?: string;
  description?: string;
}

function FeaturedProductsCards({
  products,
  title,
  description,
}: FeaturedProductsCardsProps) {
  return (
    <section className="container mt-12">
      <div className="">
        <h2 className="font-semibold text-2xl md:text-3xl mb-1 md:mb-3">
          {title}
        </h2>
        <p className="max-w-4xl text-sm md:text-md leading-[1.5] tracking-[-2%] mb-2">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 py-5 overflow-auto">
        <Suspense
          fallback={[...Array(4)].map((_, index) => (
            <ProductCardSkeleton key={`Product-Skeleton-${index}`} />
          ))}
        >
          {products.map(({ node }) => (
            <ProductCard key={`product-card-${node.id}`} product={node} />
          ))}
        </Suspense>
      </div>
    </section>
  );
}

interface BannerCollectionCardProps {
  imageSrc: string;
  title: string;
  description: string;
  ctatext: string;
  collectionHref: string;
  imageLeft: boolean;
}

function DifferentFeatureCards() {
  const features = [
    {
      Icon: Icons.cart,
      title: "Compra fácil y rápida",
      description:
        "Navega, elige y paga en minutos. Te acompañamos en todo el proceso por WhatsApp si lo necesitas.",
    },
    {
      Icon: Icons.tag,
      title: "Productos de calidad",
      description:
        "Seleccionamos artículos con buena relación calidad/precio y revisamos cada pedido antes de entregarlo.",
    },
    {
      Icon: Icons.package,
      title: "Envío a domicilio",
      description:
        "Entregamos a domicilio en Santa Clara, Placetas, Encrucijada y Calabazar de Sagua. También coordinamos puntos de entrega según tu ubicación.",
    },
    {
      Icon: Icons.award,
      title: "Compras por encargo",
      description:
        "Hacemos compras por encargo en Shein, Temu y Amazon. Tú nos mandas el link y te cotizamos rápido con fecha estimada.",
    },
  ];
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-5 gap-y-8 gap-x-5 md:gap-x-8 lg:gap-x-12 mx-auto px-4 sm:px-6">
      {features.map(({ Icon, title, description }, index) => (
        <div
          className="text-center mx-auto max-w-[20rem] md:max-w-[18rem]"
          key={`FeatureCards_${index}`}
        >
          <div className="flex justify-center items-center p-4 sm:p-5">
            <Icon
              width={40}
              height={40}
              className="sm:w-[45px] sm:h-[45px] mb-4 sm:mb-5 text-accent font-light"
            />
          </div>

          <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-primary">
            {title}
          </h4>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      ))}
    </section>
  );
}

function BannerCollectionCard({
  imageSrc,
  title,
  description,
  ctatext,
  collectionHref,
  imageLeft,
}: BannerCollectionCardProps) {
  return (
    <section className="max-w-[1920px] mx-auto min-h-[500px] sm:min-h-[560px] md:h-[580px] bg-[#FFF8EE] grid grid-cols-12 my-8 sm:my-12 md:my-16">
      <div
        className={cn(
          "relative w-full h-[280px] sm:h-[320px] md:h-[580px] col-span-12 md:col-span-8 overflow-hidden",
          imageLeft ? "md:order-1" : "md:order-2",
        )}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover object-center"
        />
      </div>

      <div
        className={cn(
          "col-span-12 md:col-span-4 py-6 sm:py-8 md:py-20 px-4 sm:px-6 md:px-12 lg:px-16 flex flex-col justify-center",
          imageLeft ? "md:order-2" : "md:order-1",
        )}
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3">
          {title}
        </h2>
        <p className="text-xs sm:text-sm leading-[1.6] md:text-base lg:text-lg tracking-tight mb-4 sm:mb-6 md:mb-12 text-left max-w-md">
          {description}
        </p>
        <Link
          href={collectionHref}
          className={cn(
            buttonVariants(),
            "rounded-full text-xs sm:text-sm md:text-base w-full sm:w-auto sm:inline-flex sm:justify-center",
          )}
        >
          {ctatext}
        </Link>
      </div>
    </section>
  );
}
