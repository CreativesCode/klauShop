// Spanish names for product colors (stored as hex). Same palette as public.wa_color_name()
// in drizzle/0025: change both together.
export const COLOR_NAMES: [string, string][] = [
  ["negro", "#000000"],
  ["blanco", "#FFFFFF"],
  ["gris", "#808080"],
  ["gris claro", "#D3D3D3"],
  ["rojo", "#FF0000"],
  ["vino", "#8B0000"],
  ["rosado", "#FFC0CB"],
  ["fucsia", "#FF1493"],
  ["naranja", "#FFA500"],
  ["amarillo", "#FFFF00"],
  ["dorado", "#D4AF37"],
  ["verde", "#008000"],
  ["verde claro", "#90EE90"],
  ["verde oliva", "#6B8E23"],
  ["turquesa", "#40E0D0"],
  ["azul claro", "#87CEEB"],
  ["azul", "#0000FF"],
  ["azul marino", "#000080"],
  ["morado", "#800080"],
  ["lila", "#C8A2C8"],
  ["marrón", "#8B4513"],
  ["beige", "#F5F5DC"],
];

const HEX = /^#?([0-9a-f]{6})$/i;

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** "#FF1493" → "fucsia" (nearest named color); non-hex values are returned as they are. */
export function colorName(value: string): string {
  const match = HEX.exec(value.trim());
  if (!match) return value;
  const [r, g, b] = toRgb(match[1]);
  let best = value;
  let bestDistance = Infinity;
  for (const [name, hex] of COLOR_NAMES) {
    const [r2, g2, b2] = toRgb(hex);
    const distance = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }
  return best;
}
