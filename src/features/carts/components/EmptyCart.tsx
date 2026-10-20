import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

function EmptyCart() {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-[18px] border border-line bg-white px-6 py-12 text-center">
      <p className="text-[15px] text-neutral-500">Tu carrito está vacío.</p>
      <Link href="/shop" className={buttonVariants({ size: "lg" })}>
        Ver novedades
      </Link>
    </section>
  );
}

export default EmptyCart;
