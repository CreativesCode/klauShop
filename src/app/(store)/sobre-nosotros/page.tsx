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
  "Conoce la historia de Klau's Shop, nuestra misión y valores. Tu tienda de confianza para moda y accesorios.",
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

export default function SobreNosotrosPage() {
  return (
    <main>
      <Shell className="max-w-screen-2xl mx-auto">
        <Header
          heading="Sobre Nosotros"
          description="Conoce más sobre Klau's Shop, nuestra historia, misión y valores. Estamos aquí para hacer que la moda sea accesible para todos."
          descriptionClassName="text-center max-w-4xl mx-auto"
        />

        {/* Hero Section */}
        <section className="mb-16">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-8 md:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <Sparkles className="h-16 w-16 text-primary-600 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-4">
                Bienvenido a Klau&apos;s Shop
              </h2>
              <p className="text-base md:text-lg text-primary-700 leading-relaxed mb-6">
                Somos una tienda online de ropa y accesorios pensada para que
                comprar sea fácil, rápido y seguro. Nuestro objetivo es
                seleccionar productos con excelente relación calidad-precio y
                ofrecer atención directa para ayudarte a elegir la mejor opción.
              </p>
              <p className="text-sm md:text-base text-primary-700 leading-relaxed">
                Realizamos envíos a domicilio en{" "}
                <strong>{siteConfig.zones}</strong> y también gestionamos
                compras por encargo en Shein, Temu y Amazon: envíanos el link,
                te cotizamos y te lo llevamos.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-primary">
            Nuestra Misión
          </h2>
          <div className="bg-white border border-primary-200 rounded-lg p-6 md:p-8">
            <p className="text-base md:text-lg text-primary-700 mb-6 text-center max-w-3xl mx-auto leading-relaxed">
              En Klau&apos;s Shop, nuestra misión es hacer que la moda sea
              accesible para todos, ofreciendo productos de calidad a precios
              justos y proporcionando un servicio excepcional que supere las
              expectativas de nuestros clientes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {missionPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-primary-50 rounded-lg p-4"
                >
                  <CheckCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-primary-700">{point}</p>
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
                  className="bg-white border border-primary-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-primary-700 leading-relaxed">
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
            ¿Por qué elegir Klau&apos;s Shop?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyChooseUs.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 bg-white border border-primary-200 rounded-lg p-6"
              >
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-primary-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary-50 border border-primary-200 rounded-lg p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
            ¿Listo para empezar a comprar?
          </h2>
          <p className="text-sm md:text-base text-primary-800 mb-6 max-w-2xl mx-auto">
            Explora nuestra colección de ropa y accesorios, o contáctanos si
            necesitas ayuda para encontrar algo específico.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "bg-primary-600 hover:bg-primary-700 text-white",
              )}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver Catálogo
            </Link>
            <Link
              href="/special-orders"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-primary-600 text-primary-600 hover:bg-primary-50 hover:text-primary-800",
              )}
            >
              Servicio de Encargos
            </Link>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 text-center">
          <p className="text-lg text-primary-700 mb-4">
            ¿Tienes preguntas o sugerencias?
          </p>
          <p className="text-sm text-primary-600 mb-6">
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
