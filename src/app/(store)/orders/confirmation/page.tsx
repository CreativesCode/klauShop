import { Shell } from "@/components/layouts/Shell";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { OpenWhatsAppButton } from "@/features/orders/components/OpenWhatsAppButton";
import { getCurrentUser } from "@/features/users/actions";
import { cn } from "@/lib/utils";
import { CheckCircle2, MessageCircle, Package } from "lucide-react";
import Link from "next/link";

type ConfirmationPageProps = {
  searchParams: {
    orderId?: string;
    orderNumber?: string;
  };
};

export default async function OrderConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { orderId, orderNumber } = searchParams;

  if (!orderId || !orderNumber) {
    return (
      <Shell layout="narrow">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-[18px] border border-line bg-white px-6 py-12 text-center">
          <p className="text-[15px] text-neutral-500">
            No se encontró información de la orden
          </p>
          <Link href="/cart" className={buttonVariants({ size: "lg" })}>
            Volver al carrito
          </Link>
        </div>
      </Shell>
    );
  }

  // Guests have no order list: "Ver mis órdenes" would send them to sign in
  const user = await getCurrentUser();

  return (
    <Shell layout="narrow">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-[28px] border border-line bg-white p-6 md:p-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="size-9 text-emerald-600" aria-hidden />
          </span>
          <h1 className="text-[clamp(24px,2.6vw,30px)] font-extrabold tracking-[-0.02em] text-ink">
            ¡Orden creada!
          </h1>
          <p className="text-[15px] text-neutral-600">
            Solo falta un paso: envíanos el pedido por WhatsApp.
          </p>
        </header>

        <div className="rounded-2xl bg-cream px-4 py-3.5 text-center">
          <p className="text-xs font-bold uppercase tracking-[.06em] text-neutral-500">
            Número de orden
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-ink">
            {orderNumber}
          </p>
        </div>

        {/* The order reaches the shop when the customer sends this message */}
        <div className="flex flex-col gap-2">
          <OpenWhatsAppButton orderId={orderId} orderNumber={orderNumber} />
          <p className="text-center text-xs text-neutral-500">
            Envía tu pedido por WhatsApp para confirmarlo.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <Package className="size-5 text-primary" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-ink">
                Productos reservados
              </h2>
              <p className="text-sm text-neutral-600">
                Los productos de tu orden han sido reservados temporalmente
                hasta que se confirme el pago.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <MessageCircle className="size-5 text-emerald-600" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-ink">
                Próximos pasos
              </h2>
              <p className="text-sm text-neutral-600">
                Cuando recibamos tu mensaje por WhatsApp, la vendedora se pondrá
                en contacto contigo para:
              </p>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-neutral-600">
                <li>Confirmar los detalles del pedido</li>
                <li>Coordinar el método de pago</li>
                <li>Acordar la entrega</li>
              </ul>
            </div>
          </li>
        </ul>

        <p className="rounded-xl bg-orange-50 px-3.5 py-3 text-[13px] text-orange-800">
          <span className="font-bold">Importante:</span> si no puedes abrir
          WhatsApp desde aquí, escribe a nuestra vendedora al{" "}
          <span className="font-bold">{siteConfig.whatsappPhone}</span>{" "}
          mencionando tu número de orden:{" "}
          <span className="font-bold">{orderNumber}</span>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {user && (
            <Link
              href="/orders"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "flex-1",
              )}
            >
              Ver mis órdenes
            </Link>
          )}
          <Link
            href="/shop"
            className={cn(buttonVariants({ size: "lg" }), "flex-1")}
          >
            Seguir comprando
          </Link>
        </div>

        <p className="text-center text-xs text-neutral-500">
          ID de orden: {orderId}
        </p>
      </div>
    </Shell>
  );
}
