import { z } from "zod";

export type CountryOption = {
  iso2: string;
  name: string;
  dialCode: string; // e.g. "53"
};

// Lista ligera (enfocada a LATAM + algunos comunes)
export const COUNTRIES: CountryOption[] = [
  { iso2: "CU", name: "Cuba", dialCode: "53" },
  { iso2: "US", name: "Estados Unidos", dialCode: "1" },
  { iso2: "CA", name: "Canadá", dialCode: "1" },
  { iso2: "MX", name: "México", dialCode: "52" },
  { iso2: "ES", name: "España", dialCode: "34" },
  { iso2: "DO", name: "República Dominicana", dialCode: "1" },
  { iso2: "PR", name: "Puerto Rico", dialCode: "1" },
  { iso2: "CO", name: "Colombia", dialCode: "57" },
  { iso2: "VE", name: "Venezuela", dialCode: "58" },
  { iso2: "AR", name: "Argentina", dialCode: "54" },
  { iso2: "CL", name: "Chile", dialCode: "56" },
  { iso2: "PE", name: "Perú", dialCode: "51" },
  { iso2: "EC", name: "Ecuador", dialCode: "593" },
  { iso2: "BO", name: "Bolivia", dialCode: "591" },
  { iso2: "PY", name: "Paraguay", dialCode: "595" },
  { iso2: "UY", name: "Uruguay", dialCode: "598" },
  { iso2: "BR", name: "Brasil", dialCode: "55" },
  { iso2: "GT", name: "Guatemala", dialCode: "502" },
  { iso2: "HN", name: "Honduras", dialCode: "504" },
  { iso2: "SV", name: "El Salvador", dialCode: "503" },
  { iso2: "NI", name: "Nicaragua", dialCode: "505" },
  { iso2: "CR", name: "Costa Rica", dialCode: "506" },
  { iso2: "PA", name: "Panamá", dialCode: "507" },
  { iso2: "JM", name: "Jamaica", dialCode: "1" },
  { iso2: "HT", name: "Haití", dialCode: "509" },
];

export const DEFAULT_COUNTRY_ISO2 = "CU";

const DEFAULT_COUNTRY =
  COUNTRIES.find((c) => c.iso2 === DEFAULT_COUNTRY_ISO2) ?? COUNTRIES[0];

const DIAL_CODES = Array.from(new Set(COUNTRIES.map((c) => c.dialCode))).sort(
  (a, b) => b.length - a.length,
);

export function normalizePhoneInput(value: string) {
  // Permite: dígitos, espacios, guiones, paréntesis y "+"
  return value.replace(/[^\d+\s().-]/g, "");
}

/**
 * Splits "+53 53077035" (or a national number) into country + national part.
 * `matched` is false when the value starts with "+" but no known dial code
 * matches yet (e.g. the user is still typing "+5").
 */
export function splitPhoneByCountry(value: string) {
  const cleaned = normalizePhoneInput(value.trim());

  // Si no viene con '+', asumimos número nacional + país por defecto
  if (!cleaned.startsWith("+")) {
    return {
      country: DEFAULT_COUNTRY,
      nationalNumber: cleaned.replace(/[^\d\s().-]/g, ""),
      matched: true,
    };
  }

  // Detectar el dialCode por coincidencia más larga
  const afterPlus = cleaned.replace(/\D/g, "");
  const matchedDial = DIAL_CODES.find((d) => afterPlus.startsWith(d));
  if (!matchedDial) {
    return {
      country: DEFAULT_COUNTRY,
      nationalNumber: afterPlus,
      matched: false,
    };
  }

  const country =
    COUNTRIES.find((c) => c.dialCode === matchedDial) ?? DEFAULT_COUNTRY;

  return {
    country,
    nationalNumber: afterPlus.slice(matchedDial.length),
    matched: true,
  };
}

export function composeInternationalPhone(
  country: CountryOption,
  nationalNumber: string,
) {
  const cleanedNational = normalizePhoneInput(nationalNumber)
    .replace(/\+/g, "")
    .trim();
  return `+${country.dialCode}${cleanedNational ? ` ${cleanedNational}` : ""}`.trim();
}

const CU_MOBILE = /^[56]\d{7}$/;

/**
 * Normalizes a phone to "+<dial> <digits>" or returns null if invalid.
 * Cuba: 8-digit mobile starting with 5 or 6; a repeated "53" prefix is dropped.
 * Other countries: 6-12 national digits.
 */
export function normalizePhone(value: string): string | null {
  const { country, nationalNumber, matched } = splitPhoneByCountry(value);
  if (!matched) return null;

  let digits = nationalNumber.replace(/\D/g, "");
  if (country.dialCode === "53") {
    if (digits.length === 10 && digits.startsWith("53")) {
      digits = digits.slice(2);
    }
    return CU_MOBILE.test(digits) ? `+53 ${digits}` : null;
  }

  if (digits.length < 6 || digits.length > 12) return null;
  return `+${country.dialCode} ${digits}`;
}

export const PHONE_INVALID_MESSAGE =
  "Número inválido: en Cuba son 8 dígitos (ej. 5XXXXXXX)";

// Shared by checkout, addresses and the admin manual order; output is normalized
export const phoneSchema = z
  .string()
  .trim()
  .max(30, "El teléfono es demasiado largo")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PHONE_INVALID_MESSAGE,
      });
      return z.NEVER;
    }
    return normalized;
  });
