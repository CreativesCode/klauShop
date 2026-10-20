import Link from "next/link";

import { Icons } from "@/components/layouts/icons";
import { AuthCard, SignupForm } from "@/features/auth";
import { Suspense } from "react";

export default function SignUpPage() {
  return (
    <AuthCard
      title="Crear cuenta"
      description="Regístrate para guardar tus favoritos y seguir tus pedidos"
      footer={
        <>
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/sign-in"
              className="font-bold text-primary-700 underline-offset-4 hover:underline"
            >
              Inicia sesión aquí
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
        <SignupForm />
      </Suspense>
    </AuthCard>
  );
}
