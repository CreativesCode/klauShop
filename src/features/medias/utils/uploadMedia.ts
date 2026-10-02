import type { CropArea } from "./prepareImage";

export type UploadStatus =
  | "preparing"
  | "uploading"
  | "saving"
  | "done"
  | "error";

export type UploadItem = {
  id: string;
  file: File;
  crop: CropArea | null;
  preview: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  mediaId?: string;
};

const messageForStatus = (status: number) => {
  if (status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permiso para subir imágenes.";
  if (status === 413) return "La imagen es demasiado grande para subirla.";
  return `Error del servidor (${status}). Intenta de nuevo.`;
};

/**
 * Uploads a single file to /api/medias. Uses XHR (not fetch) to report upload progress.
 * Resolves with the created media id.
 */
export function uploadMedia(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/medias");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { ids?: string[]; message?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON responses (e.g. platform 413 pages) fall through to the status message.
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.ids?.[0]) {
        resolve(body.ids[0]);
        return;
      }
      reject(new Error(body?.message || messageForStatus(xhr.status)));
    };

    xhr.onerror = () =>
      reject(new Error("Sin conexión con el servidor. Revisa tu internet."));

    const formData = new FormData();
    formData.append("files[0]", file);
    xhr.send(formData);
  });
}
