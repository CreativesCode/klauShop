import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <p className="text-muted-foreground max-w-md">
        Puede que el producto ya no esté disponible o que el enlace esté mal
        escrito.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link href="/shop" className={cn(buttonVariants())}>
          Ver la tienda
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
