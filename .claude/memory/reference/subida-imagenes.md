# Subida de imagenes (medias)

- Un solo componente sube imagenes al catalogo: `UploadMediaContainer` (usado en /admin/medias, ProductForm, CollectionForm via ImageDialog).
  El avatar de /setting va aparte (`/api/profile/avatar`, Supabase Storage directo, max 2MB).
- **Vercel corta cuerpos > ~4.5MB con 413 no-JSON.** Por eso (2026-09-25) el cliente recorta/comprime antes de subir:
  `features/medias/utils/prepareImage.ts` (canvas, max 2000px, WebP con fallback JPEG, limite 4MB; GIF sin tocar).
- Flujo: seleccionar -> `ImageCropDialog` (react-easy-crop; Cuadrado 1:1 productos, 16:9 colecciones, Original; opcional)
  -> un request por archivo con XHR (`utils/uploadMedia.ts`, progreso real) -> tarjeta con estado
  Optimizando / Subiendo % / Guardando / Subida / Error + Reintentar.
- `POST /api/medias` exige admin (`app_metadata.isAdmin`) y responde `{ ids }` o `{ message }` en espanol.
- Eliminar (2026-09-25): `DELETE /api/medias/[id]` (solo admin). Antes era un stub (solo toast). Bloquea con 409 si es
  imagen principal de producto/coleccion (FK RESTRICT); si esta en galerias (`product_medias`, FK CASCADE) se quita de ellas,
  y el dialogo lo avisa (`features/medias/server/getMediaUsage.ts`). Borra fila y luego objeto del bucket.
- "Actualizar" alt en UpdateMediaForm sigue SIN implementar (onSubmit comentado).
- Pendiente conocido: "Cargar mas" reemplaza la pagina en vez de acumular.
