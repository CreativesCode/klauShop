import { Shell } from "@/components/layouts/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenWhatsAppButton } from "@/features/orders/components/OpenWhatsAppButton";
import { CheckCircle2, MessageCircle, Package } from "lucide-react";
import Link from "next/link";

type ConfirmationPageProps = {
  searchParams: {
    orderId?: string;
    orderNumber?: string;
  };
};

export default function OrderConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const { orderId, orderNumber } = searchParams;

  if (!orderId || !orderNumber) {
    return (
      <Shell className="max-w-screen-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No se encontró información de la orden
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/cart">
                <Button>Volver al carrito</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell layout="narrow">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            ¡Orden Creada Exitosamente!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Número de orden */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Número de Orden
            </p>
            <p className="text-2xl font-bold">{orderNumber}</p>
          </div>

          {/* The order reaches the shop when the customer sends this message */}
          <div className="space-y-2">
            <OpenWhatsAppButton orderId={orderId} orderNumber={orderNumber} />
            <p className="text-xs text-center text-muted-foreground">
              Toca el botón para enviarnos tu pedido por WhatsApp.
            </p>
          </div>

          {/* Información principal */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold">Productos Reservados</h3>
                <p className="text-sm text-muted-foreground">
                  Los productos de tu orden han sido reservados temporalmente
                  hasta que se confirme el pago.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">Próximos Pasos</h3>
                <p className="text-sm text-muted-foreground">
                  Cuando recibamos tu mensaje por WhatsApp, la vendedora se
                  pondrá en contacto contigo para:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                  <li>Confirmar los detalles del pedido</li>
                  <li>Coordinar el método de pago</li>
                  <li>Acordar la entrega</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Nota importante */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Importante:</span> Si no puedes
              abrir WhatsApp desde aquí, escribe a nuestra vendedora mencionando
              tu número de orden:{" "}
              <span className="font-bold">{orderNumber}</span>
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Ver mis órdenes
              </Button>
            </Link>
            <Link href="/shop" className="flex-1">
              <Button className="w-full">Continuar comprando</Button>
            </Link>
          </div>

          {/* ID de orden (pequeño) */}
          <p className="text-xs text-center text-muted-foreground pt-4">
            ID de orden: {orderId}
          </p>
        </CardContent>
      </Card>
    </Shell>
  );
}
