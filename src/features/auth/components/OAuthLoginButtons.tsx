"use client";
import { getURL } from "@/lib/utils";
import { getSafeRedirect } from "@/lib/safeRedirect";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

function OAuthLoginButtons() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  // The callback route sends the user back here after exchanging the code
  const next =
    getSafeRedirect(
      searchParams?.get("redirect") ?? searchParams?.get("from"),
    ) ?? "/";
  const callbackUrl = `${getURL()}auth/callback?next=${encodeURIComponent(next)}`;

  const signWithGoogle = async () => {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Use the server callback route so we can exchange `?code=...` for a session
        // and then redirect deterministically.
        redirectTo: callbackUrl,
      },
    });

    if (error) {
      router.push("/sign-in");
    }

    setIsLoading(false);
  };

  const signWithGithub = async () => {
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl,
      },
    });

    setIsLoading(false);
  };
  return (
    <div className="flex flex-col space-y-3">
      <Button onClick={signWithGoogle} disabled={isLoading}>
        {isLoading && (
          <Spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        <Icons.google className="w-4 h-4 mr-5" />
        Continuar con Google
      </Button>

      <Button onClick={signWithGithub} disabled={isLoading}>
        {isLoading && (
          <Spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        <Icons.gitHub className="w-4 h-4 mr-5" />
        Continuar con GitHub
      </Button>
    </div>
  );
}

export default OAuthLoginButtons;
