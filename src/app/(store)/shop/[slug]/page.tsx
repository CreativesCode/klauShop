import { Icons } from "@/components/layouts/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata, getPageTitle, siteConfig } from "@/config/site";
// import { ProductCommentsSection } from "@/features/comments";
import {
  ProductCard,
  ProductImageShowcase,
  ProductStockAndFormWrapper,
  ShareProductButton,
} from "@/features/products";
import { generateWhatsAppUrl } from "@/features/orders/utils/whatsapp";
import { AddToWishListButton } from "@/features/wishlists";
import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { cn, formatCUP, getURL, keytoUrl, stripHtml } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// ISR: cached HTML is fast on slow networks; price/stock refresh within 60s,
// and right away after admin changes (revalidateStorefront)
export const revalidate = 60;

type Props = {
  params: {
    slug: string;
  };
};

const ProductDetailPageQuery = gql(/* GraphQL */ `
  query ProductDetailPageQuery($productSlug: String) {
    productsCollection(filter: { slug: { eq: $productSlug } }) {
      edges {
        node {
          id
          name
          slug
          description
          rating
          price
          discount
          badge
          stock
          tags
          totalComments
          colors
          sizes
          materials
          ...ProductImageShowcaseFragment
          commentsCollection(first: 5) {
            edges {
              node {
                ...ProductCommentsSectionFragment
              }
            }
          }
          collections {
            id
            label
            slug
          }
        }
      }
    }
    recommendations: productsCollection(first: 4) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }
  }
`);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const queryVars: {
    productSlug: string;
  } = {
    productSlug: params.slug,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await getServiceClient().query(
    ProductDetailPageQuery as any,
    queryVars as any,
  );

  if (!data || !data.productsCollection || !data.productsCollection.edges) {
    return getPageMetadata();
  }

  const productNode = data.productsCollection.edges[0]?.node;
  if (!productNode) {
    return getPageMetadata();
  }

  const { name, description, price, discount, slug } = productNode;

  // Calcular precio con descuento
  const discountValue = discount ? parseFloat(discount.toString()) : 0;
  const hasDiscount = discountValue > 0;
  const priceValue = parseFloat(price.toString());
  const discountedPrice = hasDiscount
    ? priceValue - (priceValue * discountValue) / 100
    : priceValue;

  // Limpiar descripción de HTML
  const cleanDescription = stripHtml(description || "");
  const metaDescription =
    cleanDescription.substring(0, 160) ||
    `${name} - ${hasDiscount ? `Precio especial: ${discountedPrice.toFixed(2)} CUP` : `Precio: ${priceValue.toFixed(2)} CUP`}`;

  // Obtener URLs
  const baseUrl = getURL();
  const productUrl = `${baseUrl}shop/${slug}`;
  const imageUrl = productNode.featuredImage?.key
    ? keytoUrl(productNode.featuredImage.key)
    : undefined;

  // Construir título con precio
  const priceText = hasDiscount
    ? `${discountedPrice.toFixed(2)} CUP (${discountValue}% OFF)`
    : `${priceValue.toFixed(2)} CUP`;

  return {
    title: getPageTitle(`${name} - ${priceText}`),
    description: metaDescription,
    openGraph: {
      title: `${name} - ${priceText}`,
      description: metaDescription,
      url: productUrl,
      siteName: siteConfig.name,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 1200,
              alt: productNode.featuredImage?.alt || name,
            },
          ]
        : [],
      type: "website",
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} - ${priceText}`,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: productUrl,
    },
  };
}

async function ProductDetailPage({ params }: Props) {
  const queryVars: {
    productSlug: string;
  } = {
    productSlug: params.slug,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await getServiceClient().query(
    ProductDetailPageQuery as any,
    queryVars as any,
  );

  if (!data || !data.productsCollection || !data.productsCollection.edges)
    return notFound();

  const productNode = data.productsCollection.edges[0]?.node;
  if (!productNode) return notFound();
  if (!productNode.stock || productNode.stock <= 0) return notFound();

  const { id, name, description, price, discount, colors, sizes, materials } =
    productNode;

  // Calcular el precio con descuento
  const discountValue = discount ? parseFloat(discount.toString()) : 0;
  const hasDiscount = discountValue > 0;
  const priceValue = parseFloat(price.toString());
  const discountedPrice = hasDiscount
    ? priceValue - (priceValue * discountValue) / 100
    : priceValue;

  // Structured Data (JSON-LD) para SEO
  const baseUrl = getURL();
  const productUrl = `${baseUrl}shop/${productNode.slug}`;
  const imageUrl = productNode.featuredImage?.key
    ? keytoUrl(productNode.featuredImage.key)
    : undefined;

  const productStructuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    description: stripHtml(description || "").substring(0, 500),
    image: imageUrl ? [imageUrl] : [],
    sku: id,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "CUP",
      price: discountedPrice.toFixed(2),
      availability:
        productNode.stock && productNode.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  // Agregar rating solo si existe
  if (productNode.rating) {
    productStructuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: parseFloat(productNode.rating.toString()),
      reviewCount: productNode.totalComments || 0,
    };
  }

  // Agregar categoría solo si existe
  if (productNode.collections?.label) {
    productStructuredData.category = productNode.collections.label;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData),
        }}
      />
      <div className="mx-auto max-w-store px-4 pt-4 md:px-6 md:pt-8 xl:px-8">
        <nav
          aria-label="Ruta"
          className="mb-3 flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-neutral-500 md:mb-6"
        >
          <Link href="/" className="shrink-0 hover:text-primary-700">
            Inicio
          </Link>
          {productNode.collections && (
            <>
              <span aria-hidden>/</span>
              <Link
                href={`/collections/${productNode.collections.slug}`}
                className="shrink-0 hover:text-primary-700"
              >
                {productNode.collections.label}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="truncate text-ink">{name}</span>
        </nav>

        <div className="flex flex-wrap items-start gap-[clamp(24px,4vw,64px)]">
          <ProductImageShowcase
            data={productNode}
            name={name}
            badge={productNode.badge}
            discount={discountValue}
            className="flex-[1_1_520px]"
          />

          <div className="flex min-w-0 max-w-[540px] flex-[1_1_380px] flex-col gap-[22px] md:sticky md:top-[150px]">
            <div className="flex items-center justify-between gap-3">
              {productNode.collections ? (
                <Link
                  href={`/collections/${productNode.collections.slug}`}
                  className="text-xs font-bold uppercase tracking-[.06em] text-neutral-500 hover:text-primary-700"
                >
                  {productNode.collections.label}
                </Link>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <ShareProductButton
                  name={name}
                  price={priceValue}
                  discount={discountValue}
                  description={description}
                  slug={productNode.slug}
                  imageKey={productNode.featuredImage?.key || null}
                />
                <AddToWishListButton
                  productId={id}
                  className="size-[42px] border border-neutral-200 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-pretty text-[clamp(26px,3vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
                {name}
              </h1>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
                <span className="text-[clamp(26px,2.6vw,32px)] font-extrabold text-ink">
                  {formatCUP(discountedPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-[17px] text-neutral-500 line-through">
                      {formatCUP(priceValue)}
                    </span>
                    <span className="text-sm font-bold text-accent-700">
                      Ahorras {formatCUP(priceValue - discountedPrice)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Suspense>
              <ProductStockAndFormWrapper
                productId={id}
                totalStock={productNode.stock || 0}
                colors={colors as string[] | null}
                sizes={sizes as string[] | null}
                materials={materials as string[] | null}
                price={discountedPrice}
              />
            </Suspense>

            <a
              href={generateWhatsAppUrl(
                `Hola, me interesa este producto: ${name}\n${productUrl}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outlineDark", size: "xl" }),
                "w-full",
              )}
            >
              <Icons.whatsapp className="size-5" aria-hidden />
              Preguntar por WhatsApp
            </a>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-start gap-2.5 rounded-2xl bg-primary-50 p-3.5 text-[13px]">
                <Icons.truck
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <span>
                  <span className="block font-bold text-ink">
                    Envío a domicilio
                  </span>
                  <span className="text-neutral-600">Costo según tu zona</span>
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-cream p-3.5 text-[13px]">
                <Icons.repeat
                  className="mt-0.5 size-5 shrink-0 text-accent-700"
                  aria-hidden
                />
                <span>
                  <span className="block font-bold text-ink">
                    Cambios al recibir
                  </span>
                  <span className="text-neutral-600">
                    Si no te sirve, lo devuelves
                  </span>
                </span>
              </div>
            </div>

            <Accordion type="single" collapsible defaultValue="description">
              <AccordionItem value="description" className="border-line">
                <AccordionTrigger className="h-14 py-0 text-[15px] font-extrabold hover:no-underline">
                  Descripción
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="text-[15px] leading-[1.65] text-neutral-600 [&_a]:text-primary-700 [&_a]:underline [&_em]:italic [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:font-bold [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-2 [&_strong]:font-bold [&_u]:underline [&_ul]:mb-2 [&_ul]:ml-6 [&_ul]:list-disc"
                    dangerouslySetInnerHTML={{ __html: description || "" }}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-line">
                <AccordionTrigger className="h-14 py-0 text-[15px] font-extrabold hover:no-underline">
                  Envío y devoluciones
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-[1.65] text-neutral-600">
                  El costo de envío se calcula según tu dirección y se muestra
                  al finalizar la compra. Si tu pedido aplica, coordinamos
                  entrega a domicilio o punto de recogida según tu zona.
                  <br />
                  Las devoluciones o cambios solo se aceptan en el momento de la
                  entrega, si el producto no le sirve o no le gusta. Una vez
                  recibido y confirmado, no realizamos devoluciones.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <section className="pt-[clamp(56px,7vw,96px)]">
          <h2 className="mb-5 text-[clamp(22px,2.2vw,30px)] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
            Te puede interesar
          </h2>
          <div className="grid grid-cols-products gap-x-3 gap-y-6 md:gap-x-6 md:gap-y-10">
            {data.recommendations &&
              data.recommendations.edges
                .filter(({ node }) => (node.stock ?? 0) > 0 && node.id !== id)
                .map(({ node }) => (
                  <ProductCard key={node.id} product={node} />
                ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default ProductDetailPage;
