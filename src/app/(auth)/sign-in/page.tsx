import { type Metadata } from "next";
import Link from "next/link";

import { Icons } from "@/components/layouts/icons";
import { getPageMetadata, siteConfig } from "@/config/site";
import { AuthCard, SigninForm } from "@/features/auth";
import { Suspense } from "react";

export const metadata: Metadata = getPageMetadata(
  "Iniciar sesión",
  `Inicia sesión para acceder a tu ${siteConfig.name}`,
);

export default function SignInPage() {
  return (
    <AuthCard
      title="¡Bienvenido de nuevo!"
      description="Inicia sesión para acceder a tu cuenta"
      footer={
        <>
          <p>
            ¿No tienes una cuenta?{" "}
            <Link
              href="/sign-up"
              className="font-bold text-primary-700 underline-offset-4 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center font-semibold text-neutral-500 transition-colors hover:text-ink"
          >
            <Icons.chevronLeft className="mr-1 size-4" aria-hidden />
            Volver a la tienda
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="h-[300px] w-full animate-pulse rounded-xl bg-surface-soft" />
        }
      >
        <SigninForm />
      </Suspense>
    </AuthCard>
  );
}
