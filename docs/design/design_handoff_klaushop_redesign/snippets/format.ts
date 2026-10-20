// Añadir a src/lib/utils.ts
// UI: "4.500 CUP" (sin decimales, punto de miles). NO reemplaza formatPrice(),
// que sigue usándose en mensajes de WhatsApp / exportaciones.
export function formatCUP(
  value: number | string,
  opts: { unit?: boolean } = {},
) {
  const n = Math.round(Number(value || 0));
  const s = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return opts.unit === false ? s : `${s} CUP`;
}

// Precio final con descuento (misma fórmula que ProductCard hoy)
export function discountedPrice(
  price: number | string,
  discount?: number | string | null,
) {
  const p = Number(price || 0);
  const d = Number(discount || 0);
  return d > 0 ? p - (p * d) / 100 : p;
}

// "Hace 12 min", "Hace 2 h", "Ayer", "18 oct" — para listas admin
export function relativeTimeEs(date: Date | string, now = new Date()) {
  const d = new Date(date);
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 60) return `Hace ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  if (h < 48) return "Ayer";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "America/Havana",
  });
}
