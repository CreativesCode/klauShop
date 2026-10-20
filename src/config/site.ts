import type { Metadata } from "next";

export const siteConfig = {
  name: "Klau's Shop",
  description: "Tu tienda favorita de ropa y accesorios.",
  zones: "Santa Clara, Placetas, Encrucijada y Calabazar de Sagua",
  whatsappPhone: "+5352564206", // Número de WhatsApp para pedidos
  orderPrefix: "KS", // Prefijo para números de orden (ej: KS-1042)
} as const;

/**
 * Genera el título de una página con el formato: "Nombre del Sitio | Título de la Página"
 */
export function getPageTitle(pageTitle?: string): string {
  if (pageTitle) {
    return `${siteConfig.name} | ${pageTitle}`;
  }
  return `${siteConfig.name} | Ropa y accesorios en Villa Clara`;
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
