import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  Heart,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Image from "next/image";
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

export default function AboutUsPage() {
  return (
    <main>
      <Shell className="max-w-screen-2xl mx-auto">
        <Header
          heading="Sobre Nosotros"
          description={`Conoce más sobre ${siteConfig.name}, nuestra historia, misión y valores. Estamos aquí para hacer que la moda sea accesible para todos.`}
          descriptionClassName="text-center max-w-4xl mx-auto"
        />

        {/* Hero Section */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 md:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]">
              <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent-200 blur-3xl" />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200/60 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-accent-600" />
                  Moda y accesorios con atención directa
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-primary-950 md:text-4xl">
                  Bienvenido a {siteConfig.name}
                </h2>

                <p className="mt-4 text-base leading-relaxed text-primary-800 md:text-lg">
                  Somos una tienda online de ropa y accesorios pensada para que
                  comprar sea fácil, rápido y seguro. Nuestro objetivo es
                  seleccionar productos con excelente relación calidad-precio y
                  ofrecer atención directa para ayudarte a elegir la mejor
                  opción.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-primary-800 md:text-base">
                  Realizamos envíos a domicilio en{" "}
                  <strong className="text-primary-900">
                    {siteConfig.zones}
                  </strong>{" "}
                  y también gestionamos compras por encargo en Shein, Temu y
                  Amazon: envíanos el link, te cotizamos y te lo llevamos.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/shop"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
                    )}
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Ver Catálogo
                  </Link>
                  <Link
                    href="/special-orders"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "border-primary-200 bg-white/60 text-primary-800 shadow-sm hover:bg-accent-50 hover:text-primary-950",
                    )}
                  >
                    Servicio de Encargos
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="grid gap-4">
                  <div className="rounded-xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
                    <p className="text-xs font-medium text-primary-700">
                      Envíos a domicilio
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-primary-800">
                      Entregas rápidas y confiables en{" "}
                      <strong className="text-primary-900">
                        {siteConfig.zones}
                      </strong>
                      .
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
                    <p className="text-xs font-medium text-primary-700">
                      Encargos internacionales
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-primary-800">
                      Shein, Temu y Amazon: envías el link, te cotizamos y
                      gestionamos todo.
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
                    <p className="text-xs font-medium text-primary-700">
                      Atención personalizada
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-primary-800">
                      Te ayudamos a elegir talla, estilo y opciones según tu
                      presupuesto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-primary">
            Nuestra Misión
          </h2>
          <div className="rounded-2xl border border-primary-100/80 bg-white p-6 shadow-sm md:p-10">
            <p className="text-base md:text-lg text-primary-800 mb-8 text-center max-w-3xl mx-auto leading-relaxed">
              En {siteConfig.name}, nuestra misión es hacer que la moda sea
              accesible para todos, ofreciendo productos de calidad a precios
              justos y proporcionando un servicio excepcional que supere las
              expectativas de nuestros clientes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {missionPoints.map((point, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 rounded-xl border border-primary-100/80 bg-gradient-to-br from-primary-50 to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700 ring-1 ring-accent-200">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-primary-800">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12 text-primary">
            Nuestros Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-primary-100/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent-100 blur-2xl opacity-0 transition-opacity group-hover:opacity-70" />
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center ring-1 ring-primary-200/70">
                        <Icon className="h-6 w-6 text-primary-700" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-primary-800 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12 text-primary">
            ¿Por qué elegir {siteConfig.name}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyChooseUs.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-2xl border border-primary-100/80 bg-white p-6 shadow-sm"
              >
                <div className="flex-shrink-0">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700 ring-1 ring-accent-200">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-primary-800 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 text-center shadow-sm md:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200 blur-3xl" />
          </div>
          <h2 className="relative text-xl md:text-2xl font-semibold text-primary mb-4">
            ¿Listo para empezar a comprar?
          </h2>
          <p className="relative text-sm md:text-base text-primary-800 mb-6 max-w-2xl mx-auto">
            Explora nuestra colección de ropa y accesorios, o contáctanos si
            necesitas ayuda para encontrar algo específico.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "bg-primary-600 hover:bg-primary-700 text-white shadow-sm",
              )}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver Catálogo
            </Link>
            <Link
              href="/special-orders"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-primary-200 bg-white/60 text-primary-800 shadow-sm hover:bg-accent-50 hover:text-primary-950",
              )}
            >
              Servicio de Encargos
            </Link>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 text-center">
          <p className="text-lg text-primary-800 mb-4">
            ¿Tienes preguntas o sugerencias?
          </p>
          <p className="text-sm text-primary-700 mb-6">
            Estamos aquí para ayudarte. Contáctanos y te responderemos lo antes
            posible.
          </p>
          <Link
            href={`https://wa.me/${siteConfig.whatsappPhone.replace(/[^0-9]/g, "")}?text=Hola, tengo una pregunta`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "bg-green-600 hover:bg-green-700 text-white",
            )}
          >
            <Image
              src="/assets/whatsapp.svg"
              alt="WhatsApp"
              width={20}
              height={20}
              className="mr-2 h-5 w-5"
            />
            Contáctanos por WhatsApp
          </Link>
        </section>
      </Shell>
    </main>
  );
}
