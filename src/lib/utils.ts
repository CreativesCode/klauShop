import { env } from "@/env.mjs";
import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getURL = () => {
  let url =
    env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000";

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export const keytoUrl = (key?: string) => {
  return key
    ? `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${env.NEXT_PUBLIC_S3_BUCKET}/${key}`
    : "https://hiyori-backpack.s3.us-west-2.amazonaws.com/public/bathroom-planning.jpg";
};

// Same format as product cards and WhatsApp messages: "200.00 CUP"
export function formatPrice(price: number | string) {
  return `${Number(price || 0).toFixed(2)} CUP`;
}

// UI price: "4.500 CUP" (no decimals, dot thousands separator).
// WhatsApp messages and exports keep formatPrice().
export function formatCUP(
  value: number | string,
  opts: { unit?: boolean } = {},
) {
  const n = Math.round(Number(value || 0));
  const s = Math.abs(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const signed = n < 0 ? `-${s}` : s;
  return opts.unit === false ? signed : `${signed} CUP`;
}

// "Hace 12 min", "Hace 2 h", "Ayer", "18 oct" for admin lists
export function relativeTimeEs(date: Date | string, now = new Date()) {
  const d = new Date(date);
  const min = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (min < 60) return `Hace ${Math.max(1, min)} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  if (h < 48) return "Ayer";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "America/Havana",
  });
}

export function formatDate(date: Date) {
  return dayjs(date).format("MMMM D, YYYY");
}

export function formatBytes(
  bytes: number,
  decimals = 0,
  sizeType: "accurate" | "normal" = "normal",
) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`;
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function unslugify(str: string) {
  return str.replace(/-/g, " ");
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

export function toSentenceCase(str: string) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

export function isArrayOfFile(files: unknown): files is File[] {
  const isArray = Array.isArray(files);
  if (!isArray) return false;
  return files.every((file) => file instanceof File);
}

export function getNameInitials(fullName: string): string {
  const nameParts = fullName.split(" ");
  let initials = "";

  for (const part of nameParts) {
    if (part.length > 0) {
      initials += part[0].toUpperCase();
      initials = initials.slice(0, 2);
    }
  }

  return initials;
}

/**
 * Removes HTML tags from a string and returns plain text
 * Useful for displaying rich text content in places where only plain text is needed
 * Works both on server and client side
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  // Simple regex to remove HTML tags and decode common entities
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Decode &amp;
    .replace(/&lt;/g, "<") // Decode &lt;
    .replace(/&gt;/g, ">") // Decode &gt;
    .replace(/&quot;/g, '"') // Decode &quot;
    .replace(/&#39;/g, "'") // Decode &#39;
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}
