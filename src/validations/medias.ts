import { FileWithPath } from "react-dropzone";
import { z } from "zod";

// Constants for validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif"];

// Helper function to validate each file in the array
// export const fileSchema = z.object({
//   size: z
//     .number()
//     .max(MAX_FILE_SIZE, "The profile picture must be a maximum of 10MB."),
//   type: z
//     .string()
//     .refine(
//       (type) => ACCEPTED_IMAGE_TYPES.includes(type),
//       "Solo se permiten imágenes."
//     ),
//   name: z.string(),
//   lastModified: z.number(),
// })

// Schema for validating the entire data object
export const mediaSchema = z.record(
  z.string(),
  z
    .custom<FileWithPath>()
    //   .transform((file) => file.length > 0 && file.item(0)),
    .refine((file) => !file || (!!file && file.size <= 500 * 1024 * 1024), {
      message: "La imagen supera el tamaño máximo permitido.",
    })
    .refine((file) => !file || (!!file && file.type?.startsWith("image")), {
      message: "Solo se permiten imágenes.",
    }),
);
