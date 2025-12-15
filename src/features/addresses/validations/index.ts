import { z } from "zod";

// Esquema de validación para crear/actualizar dirección
export const addressSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre es demasiado largo"),
  recipientName: z
    .string()
    .min(2, "El nombre del destinatario debe tener al menos 2 caracteres")
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
  fullAddress: z
    .string()
    .max(500, "La dirección es demasiado larga")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, "Las notas son demasiado largas")
    .optional()
    .nullable(),
  isDefault: z.boolean().optional().default(false),
});

// Esquema para actualizar dirección (todos los campos opcionales excepto el ID)
export const updateAddressSchema = addressSchema.partial().extend({
  id: z.string(),
});

// Tipo inferido del esquema
export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
