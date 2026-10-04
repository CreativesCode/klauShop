import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Escribe un correo electrónico válido" });

// Sign in only checks presence: accounts created before the policy must still log in
export const authSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Escribe tu contraseña" }).max(100),
});

export const signupSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre es demasiado largo" }),
  password: z
    .string()
    .min(8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    })
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
      message:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo (!@#$%^&*)",
    }),
});

// Supabase auth error messages (gotrue-js 2.62 has no error codes) → Spanish copy
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed":
    "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.",
  "User already registered": "Ya existe una cuenta con este correo.",
};

export function getAuthErrorMessage(error: {
  message?: string;
  status?: number;
}): string {
  if (error.message && AUTH_ERROR_MESSAGES[error.message]) {
    return AUTH_ERROR_MESSAGES[error.message];
  }
  // Fetch failures come back with status 0
  if (!error.status) {
    return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  }
  if (error.status === 429) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }
  return "Algo salió mal. Inténtalo de nuevo.";
}
