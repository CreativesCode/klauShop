import { buttonVariants } from "@/components/ui/button";
import { AuthCard } from "@/features/auth";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <AuthCard
      title="Algo salió mal"
      description="No pudimos completar la operación. Inténtalo de nuevo en unos minutos."
    >
      <div className="flex flex-col gap-3">
        <Link
          href="/sign-in"
          className={buttonVariants({ size: "xl", className: "w-full" })}
        >
          Volver a iniciar sesión
        </Link>
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            size: "xl",
            className: "w-full",
          })}
        >
          Ir a la tienda
        </Link>
      </div>
    </AuthCard>
  );
}
