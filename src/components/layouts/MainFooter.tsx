import { siteConfig } from "@/config/site";
import { gql } from "@/gql";
import { filterVisibleCollections } from "@/features/collections/server/visibleCollections";
import { getServiceClient } from "@/lib/urql-service";
import { NavItemWithOptionalChildren } from "@/types";
import Link from "next/link";
import Branding from "./Branding";
import FooterCategoriesAccordion from "./FooterCategoriesAccordion";

type Props = {};

const FooterCategoriesQuery = gql(/* GraphQL */ `
  query FooterCategoriesQuery {
    collectionsCollection(orderBy: [{ order: DescNullsLast }]) {
      edges {
        node {
          id
          label
          slug
          parent_id
          order
        }
      }
    }
  }
`);

async function MainFooter({}: Props) {
  // Obtener todas las categorías
  const { data } = await getServiceClient().query(FooterCategoriesQuery, {});

  const allCategories = await filterVisibleCollections(
    data?.collectionsCollection?.edges.map((edge) => ({
      id: edge.node.id,
      label: edge.node.label,
      slug: edge.node.slug,
      parent_id: edge.node.parent_id,
      order: edge.node.order,
    })) || [],
  );

  const rootCategories =
    allCategories
      .filter((cat) => cat.parent_id === null)
      .map((cat) => ({
        title: cat.label,
        href: `/collections/${cat.slug}`,
        items: [],
      })) || [];

  const footerSiteMap: NavItemWithOptionalChildren[] = [
    {
      title: "Servicios",
      items: [
        { title: "Encargos", href: "/special-orders", items: [] },
        { title: "Mis órdenes", href: "/orders", items: [] },
        { title: "Favoritos", href: "/wish-list", items: [] },
      ],
    },
    {
      title: "Información",
      items: [{ title: "Sobre nosotros", href: "/about-us", items: [] }],
    },
  ];

  const columnTitle =
    "mb-3 text-[13px] font-extrabold uppercase tracking-[.06em] text-ink";
  const linkClass =
    "text-sm text-neutral-600 transition-colors hover:text-primary";

  return (
    <footer className="mt-[clamp(56px,7vw,104px)] border-t border-line-header bg-white">
      <div className="mx-auto max-w-store px-4 md:px-6 xl:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-8 py-[clamp(36px,5vw,64px)]">
          <div className="flex max-w-[380px] flex-col gap-3 md:col-span-2">
            <Branding height={44} />
            <p className="text-sm leading-[1.6] text-neutral-600">
              Tu tienda online de ropa y accesorios. Envíos a domicilio en{" "}
              {siteConfig.zones}.
            </p>
          </div>

          {/* Categories: accordion on mobile, column on desktop */}
          <div className="md:hidden">
            <p className={columnTitle}>Categorías</p>
            <FooterCategoriesAccordion categories={allCategories} />
          </div>
          <div className="hidden md:block">
            <p className={columnTitle}>Categorías</p>
            <div className="flex flex-col gap-2.5">
              {rootCategories.map((item) => (
                <Link key={item.href} href={item.href!} className={linkClass}>
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {footerSiteMap.map(({ title, items }) => (
            <div key={title}>
              <p className={columnTitle}>{title}</p>
              <div className="flex flex-col gap-2.5">
                {items?.map((i) => (
                  <Link href={i.href || ""} key={i.title} className={linkClass}>
                    {i.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-surface-tint py-[18px] text-[13px] text-neutral-500">
          &copy; {new Date().getFullYear()} {siteConfig.name}. Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
}

export default MainFooter;
