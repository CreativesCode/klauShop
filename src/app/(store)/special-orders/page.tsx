import { Icons } from "@/components/layouts/icons";
import { Shell } from "@/components/layouts/Shell";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata, siteConfig } from "@/config/site";
import { generateWhatsAppUrl } from "@/features/orders/utils/whatsapp";
import { cn } from "@/lib/utils";
import { CheckCircle, DollarSign, MessageCircle, Package } from "lucide-react";
import Link from "next/link";

export const metadata = getPageMetadata(
  "Encargos",
  "Realiza encargos desde Shein, Temu y Amazon. Envíanos el link, te cotizamos y te lo llevamos a tu domicilio.",
);

const steps = [
  {
    title: "Envíanos el link",
    description:
      "Comparte con nosotros el enlace del producto que deseas comprar desde Shein, Temu o Amazon.",
    icon: MessageCircle,
  },
  {
    title: "Te cotizamos",
    description:
      "Revisamos el producto y te enviamos una cotización detallada con el precio final y tiempo estimado de entrega.",
    icon: DollarSign,
  },
  {
    title: "Confirmas tu pedido",
    description:
      "Una vez que apruebes la cotización, procedemos con la compra y te mantenemos informado del proceso.",
    icon: CheckCircle,
  },
  {
    title: "Recibes tu pedido",
    description:
      "Te entregamos tu producto en la comodidad de tu hogar en las zonas de cobertura.",
    icon: Package,
  },
];

const platforms = [
  {
    name: "Shein",
    description: "Moda, accesorios y productos de belleza",
  },
  {
    name: "Temu",
    description: "Productos variados con excelentes precios",
  },
  {
    name: "Amazon",
    description: "Amplia variedad de productos internacionales",
  },
];

const benefits = [
  {
    title: "Sin complicaciones",
    description:
      "Nos encargamos de todo el proceso de compra y gestión del pedido.",
  },
  {
    title: "Precios transparentes",
    description:
      "Cotización clara sin sorpresas. Conoces el precio final antes de confirmar.",
  },
  {
    title: "Entrega a domicilio",
    description: `Llevamos tu pedido hasta tu casa en ${siteConfig.zones}.`,
  },
  {
    title: "Seguimiento constante",
    description:
      "Te mantenemos informado en cada paso del proceso de tu encargo.",
  },
];

const faqs = [
  {
    question: "¿Cuánto tiempo tarda en llegar mi encargo?",
    answer:
      "El tiempo de entrega varía según la plataforma y el producto. Generalmente, los pedidos internacionales pueden tardar entre 2 a 4 semanas. Te informaremos el tiempo estimado al momento de la cotización.",
  },
  {
    question: "¿Cómo se calcula el precio?",
    answer:
      "El precio incluye el costo del producto, gastos de envío internacional, impuestos y nuestra comisión de gestión. Todo se detalla claramente en la cotización que te enviamos.",
  },
  {
    question: "¿Puedo cancelar mi pedido?",
    answer:
      "Puedes cancelar tu pedido antes de que confirmemos la compra. Una vez realizado el pago y procesada la compra, no es posible cancelar. Consulta con nosotros para más detalles.",
  },
  {
    question: "¿Qué zonas cubren para la entrega?",
    answer: `Realizamos entregas a domicilio en ${siteConfig.zones}. Si vives fuera de estas zonas, contáctanos para evaluar opciones.`,
  },
];

const sectionTitle =
  "text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.02em] text-ink";

export default function SpecialOrdersPage() {
  const orderUrl = generateWhatsAppUrl(
    "Hola, quiero hacer un encargo. Este es el link del producto: ",
  );
  const questionUrl = generateWhatsAppUrl(
    "Hola, tengo una pregunta sobre encargos",
  );

  return (
    <Shell className="gap-12 md:gap-16">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(28px,4vw,56px)] rounded-4xl bg-primary-950 p-[clamp(28px,5vw,64px)] text-white">
        <div className="flex flex-col items-start gap-5">
          <span className="text-xs font-extrabold uppercase tracking-[.14em] text-accent-300">
            Servicio de encargos
          </span>
          <h1 className="font-display text-[clamp(38px,4.6vw,64px)] leading-none tracking-[-0.01em]">
            ¿Lo viste en Shein, Temu o Amazon?{" "}
            <em className="italic text-primary-300">Te lo traemos.</em>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-primary-200">
            Envíanos el link del producto, te cotizamos y te lo llevamos hasta
            tu domicilio.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "accent", size: "xl" })}
            >
              <Icons.whatsapp className="size-5" aria-hidden />
              Enviar link por WhatsApp
            </a>
            <Link
              href="#faq"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white",
              )}
            >
              Preguntas frecuentes
            </Link>
          </div>
        </div>
        <ul className="flex flex-col gap-3">
          {platforms.map((platform) => (
            <li
              key={platform.name}
              className="flex items-center gap-4 rounded-[18px] border border-white/[.12] bg-white/[.07] px-5 py-[18px]"
            >
              <Icons.packageSearch
                className="size-6 shrink-0 text-accent-300"
                aria-hidden
              />
              <span>
                <span className="block text-base font-bold">
                  {platform.name}
                </span>
                <span className="mt-0.5 block text-sm text-primary-200">
                  {platform.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className={sectionTitle}>¿Cómo funciona?</h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary-50">
                    <Icon className="size-5 text-primary" aria-hidden />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-[.08em] text-neutral-400">
                    Paso {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-ink">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className={sectionTitle}>¿Por qué elegir nuestro servicio?</h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="flex gap-4 rounded-[18px] border border-line bg-white p-5"
            >
              <Icons.circleCheck
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <h3 className="text-base font-extrabold text-ink">
                  {benefit.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {benefit.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="flex scroll-mt-[120px] flex-col gap-6">
        <h2 className={sectionTitle}>Preguntas frecuentes</h2>
        <div className="overflow-hidden rounded-[18px] border border-line bg-white">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group border-t border-line-soft first:border-t-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Icons.chevronDown
                  className="size-4 shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-[24px] bg-cream px-6 py-10 text-center">
        <p className="text-lg font-bold text-ink">
          ¿Tienes más preguntas? Estamos aquí para ayudarte
        </p>
        <a
          href={questionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "accent", size: "lg" })}
        >
          <Icons.whatsapp className="size-5" aria-hidden />
          Escríbenos por WhatsApp
        </a>
      </section>
    </Shell>
  );
}
