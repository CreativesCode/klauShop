import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata } from "@/config/site";
import { CollectionCardFragment } from "@/features/collections";
import { filterVisibleCollections } from "@/features/collections/server/visibleCollections";
import { generateWhatsAppUrl } from "@/features/orders/utils/whatsapp";
import { HomeProductTabs, ProductCardFragment } from "@/features/products";
import { getCurrentUser } from "@/features/users/actions";
import { DocumentType, gql } from "@/gql";
import { getServiceClient } from "@/lib/urql-service";
import { cn, formatCUP, keytoUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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
      filter: { featured: { eq: true }, stock: { gt: 0 } }
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
      filter: { show_in_slider: { eq: true }, stock: { gt: 0 } }
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

  // Only collections with products in stock (empty ones are hidden in every store menu)
  const collectionCards = (
    await filterVisibleCollections(
      data.collectionScrollCards.edges.map((edge) => ({
        id: edge.node.id,
        edge,
      })),
    )
  ).map(({ edge }) => edge);

  const sliderInStock = (data.sliderProducts?.edges ?? []).filter(
    ({ node }) => (node.stock ?? 0) > 0,
  );

  // Single "Te encantarán" grid: slider + featured products, without repeats
  const seen = new Set<string>();
  const homeProducts = [...sliderInStock, ...(data.products?.edges ?? [])]
    .map(({ node }) => node)
    .filter((node) => !seen.has(node.id) && seen.add(node.id));

  return (
    <div className="mx-auto max-w-store px-4 md:px-6 xl:px-8">
      <HeroSection products={homeProducts.slice(0, 3)} />
      <PerkStrip />

      {collectionCards.length > 0 && (
        <CategoryRail collections={collectionCards} />
      )}

      {homeProducts.length > 0 && (
        <section id="productos" className="pt-12 md:pt-16 lg:pt-[88px]">
          <HomeProductTabs
            products={homeProducts}
            title="Te encantarán"
            description="Piezas casuales y urbanas, con existencias limitadas."
          />
          <div className="mt-8 flex justify-center md:mt-10">
            <Link
              href="/shop"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Ver toda la tienda
            </Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-3 pt-12 md:gap-5 md:pt-16 lg:pt-[88px]">
        <EditorialBanner
          imageSrc={keytoUrl("public/banner-cupboard.jpg")}
          eyebrow="Armario cápsula"
          title="Esenciales."
          description="Prendas versátiles que combinan entre sí sin esfuerzo. Vístete con elegancia en minutos."
          ctaText="Explorar ropa"
          href="/collections/womens-clothing"
        />
        <EditorialBanner
          imageSrc={keytoUrl("public/banner-swimwear.jpg")}
          eyebrow="Colección playa"
          title="Verano."
          description="Diseños atemporales y cortes que realzan tu belleza natural, hechos para durar."
          ctaText="Ver ropa de playa"
          href="/collections/swimwear"
        />
      </section>

      <SpecialOrdersBlock />
    </div>
  );
}

type HomeProduct = DocumentType<typeof ProductCardFragment>;

function discountedPrice(product: HomeProduct) {
  const price = Number(product.price || 0);
  const discount = Number(product.discount || 0);
  return discount > 0 ? price - (price * discount) / 100 : price;
}

const zoomOnHover =
  "object-cover transition-transform [transition-duration:600ms] ease-soft group-hover:scale-[1.04] motion-reduce:transform-none";

function HeroSection({ products }: { products: HomeProduct[] }) {
  const [main, ...rest] = products;

  return (
    <section className="pt-4 md:pt-8">
      <div className="flex flex-wrap overflow-hidden rounded-[clamp(20px,2.4vw,32px)] bg-cream">
        <div className="flex flex-[1_1_400px] flex-col justify-center gap-[clamp(18px,2vw,26px)] p-[clamp(28px,5vw,72px)]">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cream-border bg-white py-1.5 pl-2 pr-3 text-[13px] font-semibold text-accent-800">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold tracking-[.04em] text-ink">
              NUEVO
            </span>
            Llegaron vestidos y accesorios
          </span>
          <h1 className="font-display text-[clamp(48px,7.2vw,104px)] leading-[.95] tracking-[-0.02em] text-ink">
            Moda para
            <br />
            el <em className="italic text-primary">día a día.</em>
          </h1>
          <p className="max-w-[440px] text-[clamp(15px,1.3vw,18px)] leading-[1.6] text-neutral-600">
            Ropa, accesorios y regalos seleccionados con cariño. Pides en
            minutos y lo coordinamos contigo por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className={buttonVariants({ size: "xl", elevated: true })}
            >
              Ver novedades
              <Icons.arrowRight className="size-[18px]" aria-hidden />
            </Link>
            <Link
              href="/special-orders"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "border-cream-strong",
              )}
            >
              Encargos Shein · Temu · Amazon
            </Link>
          </div>
        </div>

        <div className="grid min-h-[clamp(340px,42vw,600px)] flex-[1_1_440px] grid-cols-[1.25fr_1fr] grid-rows-2 gap-2.5 p-2.5">
          {main ? (
            <Link
              href={`/shop/${main.slug}`}
              className="group relative row-span-2 overflow-hidden rounded-[22px] bg-surface-tint"
            >
              <Image
                src={keytoUrl(main.featuredImage.key)}
                alt={main.featuredImage.alt || main.name}
                fill
                priority
                sizes="(max-width: 768px) 55vw, 30vw"
                className={zoomOnHover}
              />
              <span className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-white/90 p-2.5 pl-3 backdrop-blur">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">
                    {main.name}
                  </span>
                  <span className="block text-[13px] tabular-nums text-neutral-600">
                    {formatCUP(discountedPrice(main))}
                  </span>
                </span>
                <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-ink text-white">
                  <Icons.arrowUpRight className="size-4" aria-hidden />
                </span>
              </span>
            </Link>
          ) : (
            <div className="relative row-span-2 overflow-hidden rounded-[22px]">
              <Image
                src={keytoUrl("public/bg-hero.jpg")}
                alt="Moda y accesorios de Klau's Shop"
                fill
                priority
                sizes="(max-width: 768px) 55vw, 30vw"
                className="object-cover"
              />
            </div>
          )}
          {[0, 1].map((i) => {
            const product = rest[i];
            if (!product)
              return <div key={i} className="rounded-[22px] bg-surface-tint" />;
            const discount = Number(product.discount || 0);
            return (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                aria-label={product.name}
                className="group relative overflow-hidden rounded-[22px] bg-surface-tint"
              >
                <Image
                  src={keytoUrl(product.featuredImage.key)}
                  alt={product.featuredImage.alt || product.name}
                  fill
                  sizes="(max-width: 768px) 45vw, 22vw"
                  className={zoomOnHover}
                />
                {discount > 0 && (
                  <Badge
                    variant="discount"
                    className="absolute left-2.5 top-2.5"
                  >
                    -{discount}%
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PerkStrip() {
  const perks = [
    {
      Icon: Icons.truck,
      title: "Envío a domicilio",
      text: "4 municipios de Villa Clara",
    },
    {
      Icon: Icons.messageCircle,
      title: "Pedido por WhatsApp",
      text: "Te confirmamos en minutos",
    },
    {
      Icon: Icons.badgeCheck,
      title: "Revisado antes de entregar",
      text: "Calidad / precio garantizada",
    },
    {
      Icon: Icons.packageSearch,
      title: "Encargos",
      text: "Shein, Temu y Amazon",
    },
  ];
  return (
    <section className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-px overflow-hidden rounded-[18px] border border-line-header bg-line-header md:mt-5">
      {perks.map(({ Icon, title, text }) => (
        <div
          key={title}
          className="flex items-center gap-3.5 bg-white px-[18px] py-4"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Icon className="size-5 text-primary" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold text-ink">{title}</span>
            <span className="block text-[13px] text-neutral-500">{text}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

interface CollectionsCardsProps {
  collections: { node: DocumentType<typeof CollectionCardFragment> }[];
}

function CategoryRail({ collections }: CollectionsCardsProps) {
  return (
    <section className="pt-12 md:pt-16 lg:pt-[88px]">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-[clamp(22px,2.2vw,30px)] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
          Compra por categoría
        </h2>
        <Link
          href="/shop"
          className="shrink-0 text-sm font-bold text-primary-700 hover:text-primary-800"
        >
          Ver todo →
        </Link>
      </div>
      {/* Bleeds to the screen edge on phones so the next card peeks in */}
      <div className="no-scrollbar -mx-4 grid snap-x snap-mandatory auto-cols-[minmax(132px,1fr)] grid-flow-col gap-2.5 overflow-x-auto px-4 md:mx-0 md:gap-4 md:px-0">
        {collections.map(({ node }) => (
          <Link
            key={node.id}
            href={`/collections/${node.slug}`}
            className="group flex snap-start flex-col gap-2.5"
          >
            <span className="relative aspect-square overflow-hidden rounded-[20px] bg-surface-muted">
              <Image
                src={keytoUrl(node.featuredImage.key)}
                alt={node.featuredImage.alt || node.label}
                fill
                sizes="(max-width: 768px) 40vw, 16vw"
                className={zoomOnHover}
              />
            </span>
            <span className="text-center text-sm font-bold text-ink group-hover:text-primary">
              {node.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface EditorialBannerProps {
  imageSrc: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
}

function EditorialBanner({
  imageSrc,
  eyebrow,
  title,
  description,
  ctaText,
  href,
}: EditorialBannerProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[clamp(380px,38vw,520px)] items-end overflow-hidden rounded-4xl"
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="(max-width: 900px) 100vw, 50vw"
        className={zoomOnHover}
      />
      <span
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(17,24,39,.75)_100%)]"
        aria-hidden
      />
      <span className="relative flex max-w-[460px] flex-col gap-3 p-[clamp(22px,3vw,36px)] text-white">
        <span className="text-xs font-extrabold uppercase tracking-[.14em] text-accent-300">
          {eyebrow}
        </span>
        <span className="font-display text-[clamp(40px,4.4vw,60px)] leading-none">
          {title}
        </span>
        <span className="text-[15px] leading-[1.55] text-white/90">
          {description}
        </span>
        <span className="mt-1 inline-flex h-[46px] w-fit items-center rounded-full bg-white px-5 text-sm font-bold text-ink">
          {ctaText}
        </span>
      </span>
    </Link>
  );
}

function SpecialOrdersBlock() {
  const steps = [
    {
      title: "Nos mandas el link",
      text: "Copia el enlace del producto y envíalo por WhatsApp.",
    },
    {
      title: "Te cotizamos rápido",
      text: "Precio final y fecha estimada de llegada, sin sorpresas.",
    },
    {
      title: "Te lo llevamos",
      text: "Entrega a domicilio o en un punto acordado.",
    },
  ];
  const whatsappUrl = generateWhatsAppUrl(
    "Hola, quiero hacer un encargo. Este es el link del producto: ",
  );

  return (
    <section id="encargos" className="pt-12 md:pt-16 lg:pt-[88px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(28px,4vw,56px)] rounded-4xl bg-primary-950 p-[clamp(28px,5vw,64px)] text-white">
        <div className="flex flex-col items-start gap-5">
          <span className="text-xs font-extrabold uppercase tracking-[.14em] text-accent-300">
            Compras por encargo
          </span>
          <h2 className="font-display text-[clamp(38px,4.6vw,64px)] leading-none tracking-[-0.01em]">
            ¿Lo viste en Shein, Temu o Amazon?{" "}
            <em className="italic text-primary-300">Te lo traemos.</em>
          </h2>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "accent", size: "xl" })}
          >
            <Icons.whatsapp className="size-5" aria-hidden />
            Enviar link por WhatsApp
          </a>
        </div>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-[18px] border border-white/[.12] bg-white/[.07] px-5 py-[18px]"
            >
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-primary-950">
                {i + 1}
              </span>
              <span>
                <span className="block text-base font-bold">{step.title}</span>
                <span className="mt-0.5 block text-sm text-primary-200">
                  {step.text}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
