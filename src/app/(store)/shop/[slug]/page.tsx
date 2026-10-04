import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPageMetadata, getPageTitle, siteConfig } from "@/config/site";
// import { ProductCommentsSection } from "@/features/comments";
import {
  ProductCard,
  ProductImageShowcase,
  ProductStockAndFormWrapper,
  ShareProductButton,
} from "@/features/products";
import { AddToWishListButton } from "@/features/wishlists";
import { gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { getURL, keytoUrl, stripHtml } from "@/lib/utils";
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
      <Shell className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-12 gap-x-8">
          <div className="space-y-8 relative col-span-12 md:col-span-7">
            <ProductImageShowcase data={productNode} />
          </div>

          <div className="col-span-12 md:col-span-5">
            <section className="flex justify-between items-start max-w-lg">
              <div>
                {productNode.collections && (
                  <Link
                    href={`/collections/${productNode.collections.slug}`}
                    className="text-xs text-gray-600"
                  >
                    {productNode.collections.label}
                  </Link>
                )}
                <h1 className="text-4xl font-semibold tracking-wide mb-2">
                  {name}
                </h1>
                <div className="flex items-center gap-3 mb-2">
                  {hasDiscount ? (
                    <>
                      <p className="text-3xl font-bold text-red-600">
                        {discountedPrice.toFixed(2)} CUP
                      </p>
                      <p className="text-xl text-gray-500 line-through">
                        {priceValue.toFixed(2)} CUP
                      </p>
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{discountValue}%
                      </span>
                    </>
                  ) : (
                    <p className="text-3xl font-bold">
                      {priceValue.toFixed(2)} CUP
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <ShareProductButton
                  name={name}
                  price={priceValue}
                  discount={discountValue}
                  description={description}
                  slug={productNode.slug}
                  imageKey={productNode.featuredImage?.key || null}
                />
                <AddToWishListButton productId={id} />
              </div>
            </section>

            <Suspense>
              <ProductStockAndFormWrapper
                productId={id}
                totalStock={productNode.stock || 0}
                colors={colors as string[] | null}
                sizes={sizes as string[] | null}
                materials={materials as string[] | null}
              />
            </Suspense>

            {/* <BuyNowButton productId={id} /> */}

            <section>
              <Accordion type="single" collapsible>
                {/* <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem> */}
                {/* <AccordionItem value="item-2">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes. It adheres to the WAI-ARIA design pattern.
                </AccordionContent>
              </AccordionItem> */}
                <AccordionItem value="item-1">
                  <AccordionTrigger>Descripción</AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="mt-2 text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-2 [&_li]:mb-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800"
                      dangerouslySetInnerHTML={{ __html: description || "" }}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Envío y devoluciones</AccordionTrigger>
                  <AccordionContent>
                    El costo de envío se calcula según tu dirección y se muestra
                    al finalizar la compra. Si tu pedido aplica, coordinamos
                    entrega a domicilio o punto de recogida según tu zona.
                    <br />
                    Las devoluciones o cambios solo se aceptan en el momento de
                    la entrega, si el producto no le sirve o no le gusta. Una
                    vez recibido y confirmado, no realizamos devoluciones.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </div>
        </div>

        <Header heading={`Te puede interesar`} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4">
          {data.recommendations &&
            data.recommendations.edges
              .filter(({ node }) => (node.stock ?? 0) > 0)
              .map(({ node }) => <ProductCard key={node.id} product={node} />)}
        </div>

        {/* <ProductCommentsSection
        comments={
          commentsCollection
            ? commentsCollection.edges.map(({ node }) => node)
            : []
        }
        totalComments={totalComments}
      /> */}
      </Shell>
    </>
  );
}

export default ProductDetailPage;
