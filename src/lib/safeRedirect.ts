/**
 * Internal path to return to after signing in, or null if the value is not a safe
 * same-site path ("//evil.com" and "/\evil.com" are protocol-relative URLs).
 */
export function getSafeRedirect(
  value: string | null | undefined,
): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** "/sign-in?redirect=<path>" for server redirects of protected pages. */
export const signInRedirect = (path: string) =>
  `/sign-in?redirect=${encodeURIComponent(path)}`;
