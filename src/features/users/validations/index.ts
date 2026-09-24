import { z } from "zod";

export const adminUserShcema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export type AdminUserFormData = z.infer<typeof adminUserShcema>;

export const promoteAdminSchema = z.object({
  userId: z.string(),
});

export type PromoteAdminSchema = z.infer<typeof promoteAdminSchema>;

// Empty string clears the phone (stops WhatsApp notifications)
export const adminPhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(20, "El teléfono es demasiado largo")
    .regex(/^(\+?[0-9\s-]{8,20})?$/, "Formato de teléfono inválido"),
});
