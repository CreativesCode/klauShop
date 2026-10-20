import { z } from "zod";

export const adminUserShcema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre (mínimo 2 caracteres)."),
  email: z.string().trim().email("Correo inválido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
});

export type AdminUserFormData = z.infer<typeof adminUserShcema>;

// Editing: the password is optional (empty keeps the current one)
export const adminUserUpdateSchema = adminUserShcema.extend({
  password: z
    .string()
    .refine(
      (v) => v === "" || v.length >= 6,
      "La contraseña debe tener al menos 6 caracteres.",
    ),
});

export type AdminUserUpdateData = z.infer<typeof adminUserUpdateSchema>;

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
