import db from "@/lib/supabase/db";
import { collections, productMedias, products } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";

export type MediaUsage = {
  // Featured images block deletion (FK ON DELETE RESTRICT).
  featuredInProducts: string[];
  featuredInCollections: string[];
  // Gallery images are removed with the media (FK ON DELETE CASCADE).
  inProductGalleries: string[];
};

export async function getMediaUsage(mediaId: string): Promise<MediaUsage> {
  const [featuredProducts, featuredCollections, galleries] = await Promise.all([
    db
      .select({ name: products.name })
      .from(products)
      .where(eq(products.featuredImageId, mediaId)),
    db
      .select({ name: collections.label })
      .from(collections)
      .where(eq(collections.featuredImageId, mediaId)),
    db
      .select({ name: products.name })
      .from(productMedias)
      .innerJoin(products, eq(productMedias.productId, products.id))
      .where(eq(productMedias.mediaId, mediaId)),
  ]);

  return {
    featuredInProducts: featuredProducts.map((row) => row.name),
    featuredInCollections: featuredCollections.map((row) => row.name),
    inProductGalleries: galleries.map((row) => row.name),
  };
}
