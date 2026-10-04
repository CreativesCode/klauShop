import "server-only";

import { revalidatePath } from "next/cache";

// Store pages cache catalog data (product page ISR, menu, footer). Call after any admin change to
// products, collections or stock so customers see new prices/stock right away.
export const revalidateStorefront = () => revalidatePath("/", "layout");
