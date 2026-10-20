import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <p className="font-display text-[clamp(72px,12vw,120px)] leading-none text-primary">
        404
      </p>
      <h1 className="text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.02em] text-ink">
        No encontramos esta página
      </h1>
      <p className="max-w-md text-[15px] text-neutral-500">
        Puede que el producto ya no esté disponible o que el enlace esté mal
        escrito.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/shop"
          className={cn(buttonVariants({ size: "xl" }), "shadow-cta")}
        >
          Ver la tienda
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "xl" }))}
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
