import { siteConfig } from "@/config/site";
import { CustomerData } from "@/lib/supabase/schema";
import type { CustomerInfoInput } from "../validations";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  listPrice?: number;
  discount?: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
};

type WhatsAppMessageData = {
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  // null = unregistered zone, cost to be defined by the admin
  shippingCost: number | null;
  customerData: CustomerData;
  adminUrl: string;
};

/**
 * Customer snapshot stored in orders.customer_data, with the zone name
 * resolved on the server (canonical name when the zone is registered).
 */
export function toCustomerData(
  input: CustomerInfoInput,
  zoneName: string,
): CustomerData {
  return {
    name: input.name,
    phone: input.phone,
    zone: zoneName,
    address: input.address,
    notes: input.notes,
  };
}

/**
 * Genera el mensaje de WhatsApp para una nueva orden
 * @param data - Datos de la orden
 * @returns Mensaje formateado para WhatsApp
 */
export function generateWhatsAppMessage(data: WhatsAppMessageData): string {
  const { orderNumber, items, subtotal, shippingCost, customerData } = data;

  let message = `🛍️ *Nueva Orden: ${orderNumber}*\n\n`;

  // Items
  message += `*Productos:*\n`;
  items.forEach((item) => {
    const variant = [item.color, item.size, item.material]
      .filter(Boolean)
      .join(", ");
    const variantText = variant ? ` (${variant})` : "";
    const discountText =
      item.discount && item.discount > 0 && item.listPrice
        ? ` (antes ~${item.listPrice.toFixed(2)}~, -${item.discount}%)`
        : "";
    message += `• ${item.name}${variantText} x${item.quantity} — ${item.price.toFixed(2)} CUP${discountText}\n`;
  });

  // Subtotal
  message += `\n*Subtotal:* ${subtotal.toFixed(2)} CUP`;

  // Shipping
  if (shippingCost === null) {
    message += `\n*Envío:* Por definir (zona no registrada)`;
    message += `\n*Total:* ${subtotal.toFixed(2)} CUP + envío por definir`;
  } else {
    message += `\n*Envío:* ${shippingCost.toFixed(2)} CUP`;
    message += `\n*Total:* ${(subtotal + shippingCost).toFixed(2)} CUP`;
  }

  // Información del cliente
  message += `\n\n*Cliente:*\n`;
  message += `• Nombre: ${customerData.name}\n`;
  message += `• Teléfono: ${customerData.phone}\n`;
  message += `• Zona: ${customerData.zone}\n`;

  if (customerData.address) {
    message += `• Dirección: ${customerData.address}\n`;
  }

  if (customerData.notes) {
    message += `\n*Notas:* ${customerData.notes}\n`;
  }

  // Link a la orden (redirige según el tipo de usuario)
  message += `\n📋 Ver orden:\n${data.adminUrl}`;

  return message;
}

/**
 * Genera el URL de WhatsApp con el mensaje pre-formateado
 * @param message - Mensaje a enviar
 * @param phoneNumber - Número de teléfono (opcional, usa el del siteConfig por defecto)
 * @returns URL de WhatsApp
 */
export function generateWhatsAppUrl(
  message: string,
  phoneNumber?: string,
): string {
  const phone = (phoneNumber || siteConfig.whatsappPhone).replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Genera el número de orden formateado con el prefijo
 * @param orderId - ID de la orden
 * @returns Número de orden formateado (ej: KS-1042)
 */
export function formatOrderNumber(orderId: string): string {
  // Extrae los últimos 4 caracteres del ID para hacer un número más corto
  const shortId = orderId.slice(-4).toUpperCase();
  return `${siteConfig.orderPrefix}-${shortId}`;
}

/**
 * Genera el mensaje y URL completo de WhatsApp para una orden
 * @param data - Datos de la orden
 * @returns Objeto con mensaje y URL
 */
export function generateWhatsAppOrderData(data: WhatsAppMessageData): {
  message: string;
  url: string;
} {
  const message = generateWhatsAppMessage(data);
  const url = generateWhatsAppUrl(message);

  return { message, url };
}
