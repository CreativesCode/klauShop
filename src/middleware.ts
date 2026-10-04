import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie before pages render (Server Components cannot write
// cookies, so an expired access token used to end in a 500). Route protection stays in each
// page/layout: guests must keep access to /cart, /wish-list and /orders/confirmation.
export async function middleware(request: NextRequest) {
  // Guests have no session cookie: skip the round trip to Supabase on slow networks
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasSession) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // Refreshes the session (and its cookies) when the access token has expired
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Pages only: skip static assets, images and API routes (they read the session themselves)
    "/((?!_next/static|_next/image|api|assets|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
