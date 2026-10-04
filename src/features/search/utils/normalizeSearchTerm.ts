/**
 * Same normalization as products.search_name (drizzle/0023): lowercase without accents,
 * so "Lápices", "lapices" and "LÁPICES" match the same products.
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
