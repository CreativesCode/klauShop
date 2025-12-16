import { type Metadata } from "next";
import Link from "next/link";

import Branding from "@/components/layouts/Branding";
import { Icons } from "@/components/layouts/icons";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { getPageMetadata, siteConfig } from "@/config/site";
import { SigninForm } from "@/features/auth";
import { Suspense } from "react";

export const metadata: Metadata = getPageMetadata(
  "Iniciar sesión",
  `Inicia sesión para acceder a tu ${siteConfig.name}`,
);

export default function SignInPage() {
  return (
    <section className="w-full max-w-md px-3 sm:px-0">
      <Card className="border-0 border-t-4 border-accent">
        <CardHeader className="space-y-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Branding className="mb-2" />
            <h1 className="text-3xl font-bold text-primary">
              ¡Bienvenido de nuevo!
            </h1>
            <p className="text-sm text-muted-foreground">
              Inicia sesión para acceder a tu{" "}
              <span className="text-primary font-medium">cuenta</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Suspense
            fallback={
              <div className="bg-zinc-400 animate-pulse max-w-xl w-full h-[360px]" />
            }
          >
            <SigninForm />
          </Suspense>

          {/* TODO: Add OAuth login buttons */}
          {/* <div className="relative my-6">
            <div className="relative flex justify-center text-xs uppercase">
              <div className="absolute inset-0 flex items-center z-0">
                <span className="w-full border-t" />
              </div>
              <span className="bg-background px-2 text-muted-foreground z-10">
                OR
              </span>
            </div>

            <div className="w-full pt-5">
              <OAuthLoginButtons />
            </div>
          </div> */}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            ¿No tienes una cuenta?{" "}
            <Link
              aria-label="Sign up"
              href="/sign-up"
              className="text-primary underline-offset-4 transition-colors hover:underline"
            >
              Regístrate aquí
            </Link>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.chevronLeft className="h-4 w-4 mr-1" />
            Volver a la página principal
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
