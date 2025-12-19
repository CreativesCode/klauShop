import { siteConfig } from "@/config/site";
import { gql } from "@/gql";
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

  const allCategories =
    data?.collectionsCollection?.edges.map((edge) => ({
      id: edge.node.id,
      label: edge.node.label,
      slug: edge.node.slug,
      parent_id: edge.node.parent_id,
      order: edge.node.order,
    })) || [];

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
      title: "Categorías",
      items: rootCategories,
    },
    {
      title: "Servicios",
      items: [
        {
          title: "Encargos",
          href: "/special-orders",
          items: [],
        },
      ],
    },
    {
      title: "Información",
      items: [
        {
          title: "Sobre Nosotros",
          href: "/about-us",
          items: [],
        },
      ],
    },
    // {
    //   title: "Customer Service",
    //   items: [
    //     {
    //       title: "Shipping & Returns",
    //       disabled: true,
    //       items: [],
    //     },
    //     {
    //       title: "Store Policy",
    //       disabled: true,
    //       items: [],
    //     },
    //     {
    //       title: "Payment Methods",
    //       disabled: true,
    //       items: [],
    //     },
    //     {
    //       title: "FAQ",
    //       disabled: true,
    //       items: [],
    //     },
    //   ],
    // },
    // {
    //   title: `About ${siteConfig.name}`,
    //   items: [
    //     {
    //       title: "Our Story",
    //       href: "https://github.com/clonglam/HIYORI-master",
    //       items: [],
    //     },
    //     {
    //       title: "Brands & Designers",
    //       disabled: true,
    //       items: [],
    //     },
    //     {
    //       title: "Stores",
    //       disabled: true,
    //       items: [],
    //     },
    //     {
    //       title: "Contact",
    //       disabled: true,
    //       items: [],
    //     },
    //   ],
    // },
  ];

  return (
    <footer className="bg-primary-50 border-t border-primary-300">
      <div className="container pb-6 pt-4 md:pt-8 max-w-screen-2xl mx-auto">
        <div className="hidden md:block mb-[80px]">
          <div className="lg:grid lg:grid-cols-5 lg:gap-x-[100px] lg:place-content-between">
            {/* Branding section: centered on tablet, left-aligned on desktop */}
            <div className="flex flex-col gap-x-5 items-center text-center mb-8 lg:mb-0 lg:col-span-2 lg:items-start lg:text-left w-full">
              <Branding width={180} height={80} />
              <div className="text-sm font-light max-w-2xl lg:max-w-none">
                <p>
                  {siteConfig.name} es tu tienda online de ropa y accesorios,
                  pensada para que comprar sea fácil, rápido y seguro.
                  Seleccionamos productos con excelente relación calidad/precio
                  y ofrecemos atención directa para ayudarte a elegir la mejor
                  opción. Realizamos envíos a domicilio en Santa Clara,
                  Placetas, Encrucijada y Calabazar de Sagua y también
                  gestionamos compras por encargo en Shein, Temu y Amazon:
                  envíanos el link, te cotizamos y te lo llevamos.
                </p>
              </div>
            </div>

            {/* Categories section: centered on tablet, right-aligned on desktop */}
            <div className="grid grid-cols-3 lg:col-span-3 gap-x-6">
              {footerSiteMap.map(({ title, items }, index) => (
                <div key={index}>
                  <p className="font-semibold mb-3 text-primary">{title}</p>
                  <div className="flex flex-col gap-y-2 flex-wrap">
                    {items?.map((i, index) => (
                      <Link
                        href={i.href || ""}
                        key={index}
                        className="text-sm text-primary-800"
                      >
                        {i.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile view: Categories Accordion */}
        <div className="md:hidden mb-6">
          <div className="mb-4">
            <FooterCategoriesAccordion categories={allCategories} />
          </div>
        </div>

        {/* <div className="flex gap-x-5 justify-between flex-col md:flex-row md:items-center items-start">
          <div></div>
          <SocialMedias containerClassName="mr-12" />
        </div> */}
        <div className="flex gap-x-5 justify-center items-center mt-4">
          <div className="text-sm text-primary-800">
            <p className="text-center">
              &copy; {new Date().getFullYear()} {siteConfig.name} by
              CreativeCode. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default MainFooter;
