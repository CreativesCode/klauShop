import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { buttonVariants } from "@/components/ui/button";
import { getPageMetadata, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  DollarSign,
  Globe,
  MessageCircle,
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = getPageMetadata(
  "Encargos",
  "Realiza encargos desde Shein, Temu y Amazon. Envíanos el link, te cotizamos y te lo llevamos a tu domicilio.",
);

const steps = [
  {
    number: "01",
    title: "Envíanos el link",
    description:
      "Comparte con nosotros el enlace del producto que deseas comprar desde Shein, Temu o Amazon.",
    icon: MessageCircle,
  },
  {
    number: "02",
    title: "Te cotizamos",
    description:
      "Revisamos el producto y te enviamos una cotización detallada con el precio final y tiempo estimado de entrega.",
    icon: DollarSign,
  },
  {
    number: "03",
    title: "Confirmas tu pedido",
    description:
      "Una vez que apruebes la cotización, procedemos con la compra y te mantenemos informado del proceso.",
    icon: CheckCircle,
  },
  {
    number: "04",
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
    color: "bg-pink-100 text-pink-700",
  },
  {
    name: "Temu",
    description: "Productos variados con excelentes precios",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Amazon",
    description: "Amplia variedad de productos internacionales",
    color: "bg-orange-100 text-orange-700",
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

export default function SpecialOrdersPage() {
  return (
    <main>
      <Shell className="max-w-screen-2xl mx-auto">
        <Header
          heading="Servicio de Encargos"
          description="¿Encontraste algo que te gusta en Shein, Temu o Amazon pero no sabes cómo comprarlo? Nosotros te ayudamos. Envíanos el link del producto, te cotizamos y te lo llevamos hasta tu domicilio."
          descriptionClassName="text-center max-w-4xl mx-auto"
        />

        {/* CTA Section */}
        <section className="mb-14">
          <div className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 text-center shadow-sm md:p-10">
            <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
              <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-200 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent-200 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200/60 backdrop-blur">
                <Globe className="h-4 w-4 text-accent-600" />
                Encargos desde Shein, Temu y Amazon
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-primary-950 md:text-3xl">
                ¿Listo para hacer tu encargo?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-800 md:text-base">
                Contáctanos por WhatsApp y comparte el link del producto que
                deseas. Te responderemos con la cotización en breve.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`https://wa.me/${siteConfig.whatsappPhone.replace(/[^0-9]/g, "")}?text=Hola, me gustaría hacer un encargo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "bg-green-600 hover:bg-green-700 text-white shadow-sm",
                  )}
                >
                  <Image
                    src="/assets/whatsapp.svg"
                    alt="WhatsApp"
                    width={20}
                    height={20}
                    className="mr-2 h-5 w-5"
                  />
                  Contactar por WhatsApp
                </Link>
                <Link
                  href="#faq"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-primary-200 bg-white/60 text-primary-800 shadow-sm hover:bg-accent-50 hover:text-primary-950",
                  )}
                >
                  Ver preguntas frecuentes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12 text-primary">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-primary-100/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-accent-100 blur-2xl opacity-0 transition-opacity group-hover:opacity-70" />
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center ring-1 ring-primary-200/70">
                        <Icon className="h-6 w-6 text-primary-700" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 inline-flex items-center rounded-full bg-accent-100 px-2 py-0.5 text-xs font-mono text-accent-800 ring-1 ring-accent-200">
                        Paso {step.number}
                      </div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-primary-800 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Platforms */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-4 text-primary">
            Plataformas disponibles
          </h2>
          <p className="text-center text-primary-800 mb-8 max-w-2xl mx-auto">
            Trabajamos con las principales plataformas de comercio electrónico
            internacional
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms.map((platform, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-primary-100/80 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-primary-100 blur-2xl opacity-0 transition-opacity group-hover:opacity-70" />
                <div className="mb-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 ring-1 ring-primary-200/60">
                    <Globe className="h-7 w-7 text-primary-800" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {platform.name}
                </h3>
                <p className="text-sm text-primary-800">
                  {platform.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12 text-primary">
            ¿Por qué elegir nuestro servicio?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
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
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-primary-800 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="relative overflow-hidden rounded-2xl border border-primary-100/80 bg-gradient-to-br from-primary-50 via-white to-accent-50 p-6 shadow-sm md:p-10"
        >
          <div className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]">
            <div className="absolute -bottom-24 left-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-200 blur-3xl" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-primary">
            Preguntas frecuentes
          </h2>
          <div className="relative space-y-6 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Cuánto tiempo tarda en llegar mi encargo?
              </h3>
              <p className="text-sm text-primary-800">
                El tiempo de entrega varía según la plataforma y el producto.
                Generalmente, los pedidos internacionales pueden tardar entre 2
                a 4 semanas. Te informaremos el tiempo estimado al momento de la
                cotización.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Cómo se calcula el precio?
              </h3>
              <p className="text-sm text-primary-800">
                El precio incluye el costo del producto, gastos de envío
                internacional, impuestos y nuestra comisión de gestión. Todo se
                detalla claramente en la cotización que te enviamos.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Puedo cancelar mi pedido?
              </h3>
              <p className="text-sm text-primary-800">
                Puedes cancelar tu pedido antes de que confirmemos la compra.
                Una vez realizado el pago y procesada la compra, no es posible
                cancelar. Consulta con nosotros para más detalles.
              </p>
            </div>
            <div className="rounded-2xl border border-primary-100/80 bg-white/70 p-5 shadow-sm ring-1 ring-primary-200/40 backdrop-blur">
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Qué zonas cubren para la entrega?
              </h3>
              <p className="text-sm text-primary-800">
                Realizamos entregas a domicilio en{" "}
                <strong>{siteConfig.zones}</strong>. Si vives fuera de estas
                zonas, contáctanos para evaluar opciones.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-primary-800 mb-6">
            ¿Tienes más preguntas? Estamos aquí para ayudarte
          </p>
          <Link
            href={`https://wa.me/${siteConfig.whatsappPhone.replace(/[^0-9]/g, "")}?text=Hola, tengo una pregunta sobre encargos`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "bg-green-600 hover:bg-green-700 text-white shadow-sm",
            )}
          >
            <Image
              src="/assets/whatsapp.svg"
              alt="WhatsApp"
              width={20}
              height={20}
              className="mr-2 h-5 w-5"
            />
            Contáctanos
          </Link>
        </div>
      </Shell>
    </main>
  );
}
