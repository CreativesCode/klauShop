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
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 md:p-8 mb-12 text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
            ¿Listo para hacer tu encargo?
          </h2>
          <p className="text-sm md:text-base text-primary-800 mb-6 max-w-2xl mx-auto">
            Contáctanos por WhatsApp y comparte el link del producto que deseas.
            Te responderemos con la cotización en breve.
          </p>
          <Link
            href={`https://wa.me/${siteConfig.whatsappPhone.replace(/[^0-9]/g, "")}?text=Hola, me gustaría hacer un encargo`}
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
            Contactar por WhatsApp
          </Link>
        </div>

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
                  className="relative bg-white border border-primary-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-mono text-primary-500 mb-1">
                        {step.number}
                      </div>
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-primary-700 leading-relaxed">
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
          <p className="text-center text-primary-700 mb-8 max-w-2xl mx-auto">
            Trabajamos con las principales plataformas de comercio electrónico
            internacional
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms.map((platform, index) => (
              <div
                key={index}
                className="bg-white border border-primary-200 rounded-lg p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <Globe className="h-12 w-12 text-primary-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">
                  {platform.name}
                </h3>
                <p className="text-sm text-primary-700">
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
                className="flex gap-4 bg-white border border-primary-200 rounded-lg p-6"
              >
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-primary-600 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-primary-700 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-primary-50 border border-primary-200 rounded-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-primary">
            Preguntas frecuentes
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Cuánto tiempo tarda en llegar mi encargo?
              </h3>
              <p className="text-sm text-primary-700">
                El tiempo de entrega varía según la plataforma y el producto.
                Generalmente, los pedidos internacionales pueden tardar entre 2
                a 4 semanas. Te informaremos el tiempo estimado al momento de la
                cotización.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Cómo se calcula el precio?
              </h3>
              <p className="text-sm text-primary-700">
                El precio incluye el costo del producto, gastos de envío
                internacional, impuestos y nuestra comisión de gestión. Todo se
                detalla claramente en la cotización que te enviamos.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Puedo cancelar mi pedido?
              </h3>
              <p className="text-sm text-primary-700">
                Puedes cancelar tu pedido antes de que confirmemos la compra.
                Una vez realizado el pago y procesada la compra, no es posible
                cancelar. Consulta con nosotros para más detalles.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                ¿Qué zonas cubren para la entrega?
              </h3>
              <p className="text-sm text-primary-700">
                Realizamos entregas a domicilio en{" "}
                <strong>{siteConfig.zones}</strong>. Si vives fuera de estas
                zonas, contáctanos para evaluar opciones.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-primary-700 mb-6">
            ¿Tienes más preguntas? Estamos aquí para ayudarte
          </p>
          <Link
            href={`https://wa.me/${siteConfig.whatsappPhone.replace(/[^0-9]/g, "")}?text=Hola, tengo una pregunta sobre encargos`}
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
            Contáctanos
          </Link>
        </div>
      </Shell>
    </main>
  );
}
