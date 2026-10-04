import { getCurrentUser } from "@/features/users/actions";
import { isAdmin } from "@/features/users/utils";
import db from "@/lib/supabase/db";
import { orders } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

type OrderRedirectProps = {
  params: { orderId: string };
};

async function OrderRedirectPage({ params: { orderId } }: OrderRedirectProps) {
  // Obtener usuario actual
  const currentUser = await getCurrentUser();

  // Si no hay usuario, redirigir a login con el orderId como parámetro para volver después
  if (!currentUser) {
    redirect(`/sign-in?redirect=/order/${orderId}`);
  }

  // Obtener la orden desde la base de datos
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return notFound();
  }

  // Verificar si el usuario es admin
  const isUserAdmin = isAdmin(currentUser);

  // Si es admin, redirigir a la página de administración
  if (isUserAdmin) {
    redirect(`/admin/orders/${orderId}`);
  }

  // Verificar si el usuario es el dueño de la orden
  // Las órdenes de WhatsApp pueden no tener user_id si el cliente no estaba autenticado
  if (order.user_id && order.user_id === currentUser.id) {
    redirect(`/orders/${orderId}`);
  }

  // Si la orden no tiene user_id, significa que fue creada sin autenticación
  // En este caso, solo los admins pueden verla (ya redirigimos arriba si es admin)
  // Para clientes no autenticados que crearon la orden, no podemos verificar la propiedad
  // sin más información, así que mostramos 404
  return notFound();
}

export default OrderRedirectPage;
