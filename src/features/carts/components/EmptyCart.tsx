import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { CartVariant } from "./CartLayout";

function EmptyCart({ variant = "page" }: { variant?: CartVariant }) {
  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6 py-12 text-center",
        variant === "page"
          ? "min-h-[320px] rounded-[18px] border border-line bg-white"
          : "flex-1",
      )}
    >
      <p className="text-[15px] text-neutral-500">Tu carrito está vacío.</p>
      <Link href="/shop" className={buttonVariants({ size: "lg" })}>
        Ver novedades
      </Link>
    </section>
  );
}

export default EmptyCart;
