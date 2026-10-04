import { getSafeRedirect } from "@/lib/safeRedirect";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Only same-site paths (an open redirect would hand the session flow to any site)
  const next = getSafeRedirect(searchParams.get("next")) ?? "/";

  const redirectTo = request.nextUrl.clone();
  const nextUrl = new URL(next, request.url);
  redirectTo.pathname = nextUrl.pathname;
  nextUrl.searchParams.forEach((value, key) =>
    redirectTo.searchParams.set(key, value),
  );
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("flow");
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  // PKCE flow (Supabase sends `?code=...`)
  if (code) {
    const supabase = createClient({ cookieStore });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirectTo.searchParams.delete("next");
      return NextResponse.redirect(redirectTo);
    }
  }

  if (token_hash && type) {
    const supabase = createClient({ cookieStore });

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirectTo.searchParams.delete("next");
      return NextResponse.redirect(redirectTo);
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = "/error";
  return NextResponse.redirect(redirectTo);
}
