// Vercel rejects request bodies above ~4.5MB, so every upload must stay under this.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 2000;
const SKIP_COMPRESSION_BYTES = 1.5 * 1024 * 1024;

export type CropArea = { x: number; y: number; width: number; height: number };

const formatMb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

// HTMLImageElement applies EXIF orientation, matching what the cropper shows.
const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "No se pudo leer la imagen. Prueba con un archivo JPG o PNG.",
        ),
      );
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));

/**
 * Crops (optional) and downsizes an image in the browser so it fits the upload limit.
 * GIFs are sent untouched to keep their animation.
 */
export async function prepareImageForUpload(
  file: File,
  crop?: CropArea | null,
): Promise<File> {
  if (file.type === "image/gif") {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `El GIF pesa ${formatMb(file.size)} MB. El máximo es ${formatMb(MAX_UPLOAD_BYTES)} MB.`,
      );
    }
    return file;
  }

  const img = await loadImage(file);
  const region = crop ?? {
    x: 0,
    y: 0,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };

  if (
    !crop &&
    file.size <= SKIP_COMPRESSION_BYTES &&
    Math.max(region.width, region.height) <= MAX_DIMENSION
  ) {
    return file;
  }

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(region.width, region.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(region.width * scale);
  canvas.height = Math.round(region.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no permite procesar la imagen.");

  ctx.drawImage(
    img,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  let blob = await canvasToBlob(canvas, "image/webp");
  let extension = "webp";

  // Older Safari can't encode WebP; fall back to JPEG on a white background.
  if (!blob || blob.type !== "image/webp") {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, "image/jpeg");
    extension = "jpg";
  }

  if (!blob) throw new Error("No se pudo procesar la imagen.");

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `La imagen sigue pesando ${formatMb(blob.size)} MB tras optimizarla. Máximo ${formatMb(MAX_UPLOAD_BYTES)} MB.`,
    );
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${baseName}.${extension}`, { type: blob.type });
}
