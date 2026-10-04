"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AddressSelector } from "@/features/addresses/components";
import { AddressInput } from "@/features/addresses/validations";
import { getShippingCostFor, useShippingZones } from "@/features/shipping";
import { normalizePhone } from "@/lib/phone";
import { SelectAddress } from "@/lib/supabase/schema";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerInfoInput } from "../validations";
import CustomerInfoForm from "./CustomerInfoForm";
import { OrderTotalSummary } from "./OrderTotalSummary";
import useCartStore from "@/features/carts/useCartStore";
import { getWhatsAppUrlStorageKey } from "./OpenWhatsAppButton";

type CartItem = {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
};

type WhatsAppCheckoutButtonProps = {
  cartItems: CartItem[];
  // Cart subtotal (same rounding as the server) for the total preview
  subtotal: number;
  disabled?: boolean;
  className?: string;
};

const GUEST_ADDRESS_KEY = "guest_last_address";
const CHECKOUT_ATTEMPT_KEY = "checkout_attempt";

// One id per checkout attempt, tied to the cart: a retry after a lost response or a double tap
// reuses it (the server returns the same order); a different cart starts a new attempt.
// Kept in sessionStorage (survives a reload) and in memory (when storage is unavailable).
let memoryAttempt: { id: string; cart: string } | null = null;

function getCheckoutAttemptId(cartItems: CartItem[]): string {
  const cart = JSON.stringify(cartItems);
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY) || "null",
    );
    if (saved?.cart === cart && typeof saved.id === "string") return saved.id;
  } catch {
    // Storage unavailable: use the in-memory attempt
  }
  if (memoryAttempt?.cart === cart) return memoryAttempt.id;

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  memoryAttempt = { id, cart };
  try {
    sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify({ id, cart }));
  } catch {
    // Storage unavailable: memoryAttempt still covers retries in this page
  }
  return id;
}

export function WhatsAppCheckoutButton({
  cartItems,
  subtotal,
  disabled = false,
  className,
}: WhatsAppCheckoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addresses, setAddresses] = useState<SelectAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SelectAddress | null>(
    null,
  );
  const [addressMode, setAddressMode] = useState<"existing" | "new">(
    "existing",
  );
  const [guestAddress, setGuestAddress] = useState<CustomerInfoInput | null>(
    null,
  );
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  // Cargar direcciones guardadas para usuarios autenticados
  useEffect(() => {
    if (user && isOpen) {
      loadAddresses();
    }
  }, [user, isOpen]);

  // Zones only for the cost preview; the server resolves the real cost
  const { zones: shippingZones } = useShippingZones(isOpen);

  // Cargar último address de guest desde localStorage
  useEffect(() => {
    if (!user && isOpen) {
      const savedAddress = localStorage.getItem(GUEST_ADDRESS_KEY);
      if (savedAddress) {
        try {
          const parsed = JSON.parse(savedAddress);
          setGuestAddress(parsed);
        } catch (e) {
          console.error("Error parsing saved address:", e);
        }
      }
    }
  }, [user, isOpen]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await fetch("/api/addresses");
      const data = await response.json();

      if (response.ok) {
        const loadedAddresses = data.addresses || [];
        setAddresses(loadedAddresses);
        // Inicializar el modo según si hay direcciones o no
        setAddressMode(loadedAddresses.length > 0 ? "existing" : "new");
        // Auto-select the default address, or the first one if none is default
        const initialAddress =
          loadedAddresses.find((a: SelectAddress) => a.isDefault) ??
          loadedAddresses[0];
        if (initialAddress) {
          setSelectedAddress(initialAddress);
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSelectAddress = (address: SelectAddress) => {
    setSelectedAddress(address);
  };

  const handleNewAddress = (data: AddressInput) => {
    // Usuario autenticado: guardar la dirección en DB y seleccionar la recién creada
    if (!user) return;

    (async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "No se pudo guardar la dirección");
        }

        const created = result.address as SelectAddress | undefined;

        if (created) {
          setAddresses((prev) => [
            created,
            ...prev.filter((a) => a.id !== created.id),
          ]);
          setSelectedAddress(created);

          // Continuar con WhatsApp usando la dirección recién guardada
          const customerData: CustomerInfoInput = {
            name: created.recipientName,
            phone: created.phone,
            zone: created.zone,
            shippingZoneId: created.shippingZoneId,
            address: created.fullAddress || "",
            notes: created.notes || "",
          };

          await handleSubmit(customerData);
        } else {
          // Si el backend no devolvió la dirección (por cualquier cambio futuro), recargamos
          await loadAddresses();

          // En este caso, no continuamos automáticamente porque no tenemos un "created" confiable.
          // El usuario podrá seleccionar y continuar manualmente.
        }
      } catch (error: any) {
        console.error("Error saving address:", error);
        toast({
          title: "Error",
          description: error.message || "No se pudo guardar la dirección.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleGuestSubmit = (customerData: CustomerInfoInput) => {
    // Guardar en localStorage para la próxima vez
    localStorage.setItem(GUEST_ADDRESS_KEY, JSON.stringify(customerData));
    handleSubmit(customerData);
  };

  const handleContinueWithSelected = () => {
    if (!selectedAddress) {
      toast({
        title: "Selecciona una dirección",
        description: "Por favor selecciona o crea una dirección de entrega",
        variant: "destructive",
      });
      return;
    }

    // Addresses saved before phone validation may hold an invalid number
    if (!normalizePhone(selectedAddress.phone)) {
      toast({
        title: "Teléfono inválido",
        description:
          "El teléfono de esta dirección no es válido. Usa una nueva dirección o corrígela en Configuración → Direcciones.",
        variant: "destructive",
      });
      return;
    }

    const customerData: CustomerInfoInput = {
      name: selectedAddress.recipientName,
      phone: selectedAddress.phone,
      zone: selectedAddress.zone,
      shippingZoneId: selectedAddress.shippingZoneId,
      address: selectedAddress.fullAddress || "",
      notes: selectedAddress.notes || "",
    };

    handleSubmit(customerData);
  };

  const handleSubmit = async (customerData: CustomerInfoInput) => {
    setIsLoading(true);
    const clientRequestId = getCheckoutAttemptId(cartItems);

    try {
      let response: Response;
      try {
        response = await fetch("/api/checkout/whatsapp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartItems,
            customerData,
            clientRequestId,
          }),
        });
      } catch {
        // Network drop: the order may or may not exist; retrying is safe (same clientRequestId)
        toast({
          title: "Sin conexión",
          description:
            "Es posible que tu pedido se haya creado. Pulsa de nuevo cuando tengas conexión: no se duplicará.",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.error === "INSUFFICIENT_STOCK") {
          toast({
            title: "Stock insuficiente",
            description: `${
              data.message || "Algunos productos no tienen stock disponible."
            } Ajusta las cantidades en tu carrito.`,
            variant: "destructive",
          });
          setIsOpen(false);
          return;
        }

        if (data.error === "PRODUCT_NOT_FOUND") {
          // Drop the missing products from the guest cart (the logged-in cart is in the DB)
          const missing: string[] = Array.isArray(data.productIds)
            ? data.productIds
            : [];
          const { cart, removeProduct } = useCartStore.getState();
          Object.keys(cart)
            .filter((key) => missing.some((id) => key.startsWith(`${id}-`)))
            .forEach(removeProduct);
          window.dispatchEvent(new Event("cart-updated"));
          toast({
            title: "Producto no disponible",
            description: data.message,
            variant: "destructive",
          });
          setIsOpen(false);
          return;
        }

        throw new Error(data.message || "Error al crear la orden");
      }

      // Éxito - cerrar modal
      setIsOpen(false);
      memoryAttempt = null;
      try {
        sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
      } catch {
        // Storage unavailable: nothing to clear
      }

      // Mostrar mensaje de éxito
      toast({
        title: "¡Orden creada exitosamente!",
        description: `Tu orden ${data.orderNumber} ha sido reservada. Envíanosla por WhatsApp.`,
      });

      // The guest cart lives in a cookie (the server only clears the logged-in cart)
      useCartStore.getState().removeAllProducts();
      window.dispatchEvent(new Event("cart-updated"));

      // The confirmation page shows a tappable WhatsApp link with the full message
      try {
        sessionStorage.setItem(
          getWhatsAppUrlStorageKey(data.orderId),
          data.whatsappUrl,
        );
      } catch {
        // Storage unavailable: the page falls back to a short message
      }

      // Desktop/Android may allow this; iOS blocks popups after an await (button is the fallback)
      window.open(data.whatsappUrl, "_blank");

      // replace: going back must not return to the (now empty) checkout
      router.replace(
        `/orders/confirmation?orderId=${data.orderId}&orderNumber=${data.orderNumber}`,
      );
    } catch (error: any) {
      console.error("Error creating WhatsApp order:", error);
      toast({
        title: "Error",
        description:
          error.message || "No se pudo crear la orden. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className={className}
          disabled={disabled || cartItems.length === 0}
        >
          <Image
            src="/assets/whatsapp.svg"
            alt="WhatsApp"
            width={20}
            height={20}
            className="mr-2 h-4 w-4"
          />
          Continuar con WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información de entrega</DialogTitle>
          <DialogDescription>
            {user
              ? "Selecciona una dirección de entrega o crea una nueva. La vendedora se pondrá en contacto contigo para confirmar el pedido."
              : "Completa tus datos para continuar con el pago por WhatsApp. La vendedora se pondrá en contacto contigo para confirmar el pedido."}
          </DialogDescription>
        </DialogHeader>

        {loadingAddresses ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Cargando direcciones...
            </p>
          </div>
        ) : user ? (
          // Usuario autenticado: mostrar selector de direcciones
          <div className="space-y-4">
            <AddressSelector
              addresses={addresses}
              onSelectAddress={handleSelectAddress}
              onNewAddress={handleNewAddress}
              onModeChange={setAddressMode}
              isLoading={isLoading}
            />
            {addressMode === "existing" && selectedAddress && (
              <>
                {(() => {
                  const cost = getShippingCostFor(shippingZones, {
                    zoneId: selectedAddress.shippingZoneId,
                    zoneName: selectedAddress.zone,
                  });
                  return (
                    <>
                      {cost === null && (
                        <Alert>
                          <AlertTitle>Envío a acordar</AlertTitle>
                          <AlertDescription>
                            Acordaremos contigo el costo de envío{" "}
                            <b>por WhatsApp</b> antes de confirmar el pedido.
                          </AlertDescription>
                        </Alert>
                      )}
                      <OrderTotalSummary
                        subtotal={subtotal}
                        shippingCost={cost}
                        zoneName={selectedAddress.zone}
                      />
                    </>
                  );
                })()}
              </>
            )}
            {addresses.length > 0 &&
              selectedAddress &&
              addressMode === "existing" && (
                <Button
                  onClick={handleContinueWithSelected}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Procesando..." : "Continuar con esta dirección"}
                </Button>
              )}
          </div>
        ) : (
          // Usuario guest: formulario tradicional con autocompletado
          <CustomerInfoForm
            subtotal={subtotal}
            onSubmit={handleGuestSubmit}
            isLoading={isLoading}
            initialData={guestAddress || undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WhatsAppCheckoutButton;
