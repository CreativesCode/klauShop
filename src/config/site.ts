import type { NavItemWithOptionalChildren } from "@/types";
import type { Metadata } from "next";

export const siteConfig = {
  name: "Klau's Shop",
  description: "Tu tienda favorita de ropa y accesorios.",
  url: "https://hiyori.hugo-coding.com",
  address: "1600 Amphitheatre Parkway in Mountain View, California",
  phone: "+1(234)-567-8901",
  email: "hello@hugo-coding.com",
  zones: "Santa Clara, Placetas, Encrucijada y Calabazar de Sagua",
  whatsappPhone: "+5352564206", // Número de WhatsApp para pedidos
  orderPrefix: "KS", // Prefijo para números de orden (ej: KS-1042)
  mainNav: [
    {
      title: "Shop",
      href: "/shop",
      description: "All the products we have to offer.",
      items: [],
    },
    {
      title: "Our Story",
      href: "https://github.com/clonglam/HIYORI-master",
      description: "Our Story.",
      items: [],
    },
    {
      title: "Brands & Designers",
      href: "https://github.com/clonglam/HIYORI-master",
      description: "Read our latest blog posts.",
      items: [],
    },
    {
      title: "Blog",
      href: "https://blog.hugo-coding.com",
      description: "Read our latest blog posts.",
      items: [],
    },
    {
      title: "Contact",
      href: "https://hugo-coding.com/#contact",
      description: "Read our latest blog posts.",
      items: [],
    },
  ] satisfies NavItemWithOptionalChildren[],
} as const;

/**
 * Genera el título de una página con el formato: "Nombre del Sitio | Título de la Página"
 */
export function getPageTitle(pageTitle?: string): string {
  if (pageTitle) {
    return `${siteConfig.name} | ${pageTitle}`;
  }
  return `${siteConfig.name} | Ecommerce Platform Built with Nextjs 14.`;
}

/**
 * Genera metadata para una página
 */
export function getPageMetadata(
  title?: string,
  description?: string,
): Metadata {
  return {
    title: getPageTitle(title),
    description: description || siteConfig.description,
    openGraph: {
      images: [
        {
          url: "https://bhwyagfoyylgrdgyngrm.supabase.co/storage/v1/object/public/klaushop/public/openGraph.jpg",
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
  };
}

export type SiteConfig = typeof siteConfig;
