import { z } from "zod";

// Validación para información del cliente en checkout de WhatsApp
export const customerInfoSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  phone: z
    .string()
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      "Formato de teléfono inválido",
    ),
  zone: z
    .string()
    .min(2, "La zona debe tener al menos 2 caracteres")
    .max(200, "La zona es demasiado larga"),
  // Registered zone; null/absent = "Otro" (cost defined later by the admin)
  shippingZoneId: z.string().nullable().optional(),
  address: z.string().max(500, "La dirección es demasiado larga").optional(),
  notes: z.string().max(1000, "Las notas son demasiado largas").optional(),
});

export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;

// Validación para crear orden por WhatsApp
export const createWhatsAppOrderSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        color: z.string().nullable().optional(),
        size: z.string().nullable().optional(),
        material: z.string().nullable().optional(),
      }),
    )
    .min(1, "El carrito debe tener al menos un producto"),
  // Shipping cost is resolved on the server from shipping_zones
  customerData: customerInfoSchema,
});

export type CreateWhatsAppOrderInput = z.infer<
  typeof createWhatsAppOrderSchema
>;
