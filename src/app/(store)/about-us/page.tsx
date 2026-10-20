import { Icons } from "@/components/layouts/icons";
import { Shell } from "@/components/layouts/Shell";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata, siteConfig } from "@/config/site";
import { generateWhatsAppUrl } from "@/features/orders/utils/whatsapp";
import { cn } from "@/lib/utils";
import { Heart, ShoppingBag, Target, Users } from "lucide-react";
import Link from "next/link";

export const metadata = getPageMetadata(
  "Sobre Nosotros",
  `Conoce la historia de ${siteConfig.name}, nuestra misión y valores. Tu tienda de confianza para moda y accesorios.`,
);

const values = [
  {
    icon: Heart,
    title: "Pasión por la moda",
    description:
      "Amamos la moda y creemos que todos merecen vestirse con estilo y calidad.",
  },
  {
    icon: ShoppingBag,
    title: "Calidad garantizada",
    description:
      "Seleccionamos cuidadosamente cada producto para ofrecerte la mejor relación calidad-precio.",
  },
  {
    icon: Users,
    title: "Atención personalizada",
    description:
      "Cada cliente es importante para nosotros. Te ayudamos a encontrar exactamente lo que buscas.",
  },
  {
    icon: Target,
    title: "Compromiso con la comunidad",
    description:
      "Estamos comprometidos con nuestra comunidad local, ofreciendo envíos a domicilio y servicio de encargos.",
  },
];

const missionPoints = [
  "Hacer la moda accesible para todos",
  "Ofrecer productos de calidad a precios justos",
  "Proporcionar un servicio excepcional y atención personalizada",
  "Facilitar las compras internacionales a través de nuestro servicio de encargos",
  "Construir relaciones duraderas con nuestros clientes",
  "Seguir trabajando con productos de calidad y precio justo",
];

const highlights = [
  {
    title: "Envíos a domicilio",
    description: `Entregas rápidas y confiables en ${siteConfig.zones}.`,
  },
  {
    title: "Encargos internacionales",
    description:
      "Shein, Temu y Amazon: envías el link, te cotizamos y gestionamos todo.",
  },
  {
    title: "Atención personalizada",
    description:
      "Te ayudamos a elegir talla, estilo y opciones según tu presupuesto.",
  },
];

const whyChooseUs = [
  {
    title: "Selección cuidadosa",
    description:
      "Cada producto en nuestro catálogo ha sido seleccionado por su calidad, diseño y valor.",
  },
  {
    title: "Precios competitivos",
    description:
      "Trabajamos directamente con proveedores para ofrecerte los mejores precios.",
  },
  {
    title: "Entrega confiable",
    description: `Entregamos a domicilio en ${siteConfig.zones} con un servicio rápido y seguro.`,
  },
  {
    title: "Servicio de encargos",
    description:
      "Si no encuentras lo que buscas, podemos traértelo desde Shein, Temu o Amazon.",
  },
];

const sectionTitle =
  "text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.02em] text-ink";

export default function AboutUsPage() {
  const contactUrl = generateWhatsAppUrl("Hola, tengo una pregunta");

  return (
    <Shell className="gap-12 md:gap-16">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-center gap-[clamp(28px,4vw,56px)] rounded-4xl bg-cream p-[clamp(28px,5vw,64px)]">
        <div className="flex flex-col items-start gap-5">
          <span className="text-xs font-extrabold uppercase tracking-[.14em] text-primary-700">
            Sobre nosotros
          </span>
          <h1 className="font-display text-[clamp(38px,4.6vw,64px)] leading-none tracking-[-0.01em] text-ink">
            Bienvenido a{" "}
            <em className="italic text-primary">{siteConfig.name}</em>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-neutral-700">
            Somos una tienda online de ropa y accesorios pensada para que
            comprar sea fácil, rápido y seguro. Seleccionamos productos con
            excelente relación calidad-precio y te atendemos directamente para
            ayudarte a elegir la mejor opción.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className={cn(buttonVariants({ size: "xl" }), "shadow-cta")}
            >
              Ver catálogo
              <Icons.arrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/special-orders"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "border-cream-strong",
              )}
            >
              Servicio de encargos
            </Link>
          </div>
        </div>
        <ul className="flex flex-col gap-3">
          {highlights.map((item) => (
            <li
              key={item.title}
              className="rounded-[18px] border border-cream-border bg-white px-5 py-[18px]"
            >
              <span className="block text-base font-bold text-ink">
                {item.title}
              </span>
              <span className="mt-0.5 block text-sm text-neutral-600">
                {item.description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className={sectionTitle}>Nuestra misión</h2>
          <p className="max-w-3xl text-[15px] leading-relaxed text-neutral-600">
            En {siteConfig.name}, nuestra misión es hacer que la moda sea
            accesible para todos, ofreciendo productos de calidad a precios
            justos y proporcionando un servicio excepcional que supere las
            expectativas de nuestros clientes.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {missionPoints.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-[18px] border border-line bg-white p-4"
            >
              <Icons.circleCheck
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <span className="text-sm font-semibold text-ink">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className={sectionTitle}>Nuestros valores</h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <li
                key={value.title}
                className="flex items-start gap-4 rounded-[18px] border border-line bg-white p-5"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Icon className="size-5 text-primary" aria-hidden />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    {value.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {value.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className={sectionTitle}>¿Por qué elegir {siteConfig.name}?</h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {whyChooseUs.map((item) => (
            <li
              key={item.title}
              className="flex gap-4 rounded-[18px] border border-line bg-white p-5"
            >
              <Icons.circleCheck
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <div>
                <h3 className="text-base font-extrabold text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-4xl bg-primary-950 px-6 py-12 text-center text-white">
        <h2 className="font-display text-[clamp(30px,3.6vw,48px)] leading-none">
          ¿Listo para empezar a comprar?
        </h2>
        <p className="max-w-2xl text-[15px] text-primary-200">
          Explora nuestra colección de ropa y accesorios, o escríbenos si
          necesitas ayuda para encontrar algo específico.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Ver catálogo
          </Link>
          <a
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "accent", size: "lg" })}
          >
            <Icons.whatsapp className="size-5" aria-hidden />
            Contáctanos por WhatsApp
          </a>
        </div>
      </section>
    </Shell>
  );
}
