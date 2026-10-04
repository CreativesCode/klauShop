import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Admin collection form (Spanish messages; the drizzle-zod schema only had English defaults)
export const collectionFormSchema = z.object({
  label: z
    .string({ required_error: "Escribe el nombre corto (label)" })
    .trim()
    .min(1, "Escribe el nombre corto (label)")
    .max(255, "Máximo 255 caracteres"),
  title: z
    .string({ required_error: "Escribe el título" })
    .trim()
    .min(1, "Escribe el título")
    .max(255, "Máximo 255 caracteres"),
  slug: z
    .string({ required_error: "Escribe el slug o genéralo desde el label" })
    .trim()
    .min(1, "Escribe el slug o genéralo desde el label")
    .max(255, "Máximo 255 caracteres")
    .regex(
      SLUG_PATTERN,
      "Solo minúsculas, números y guiones (ej. ropa-de-mujer)",
    ),
  description: z
    .string({ required_error: "Escribe una descripción" })
    .trim()
    .min(1, "Escribe una descripción"),
  featuredImageId: z
    .string({ required_error: "Elige una imagen destacada" })
    .min(1, "Elige una imagen destacada"),
  parentId: z.string().nullable().optional(),
  showInHome: z.boolean().nullable().optional(),
  order: z.number().int().nullable().optional(),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;
