"use client";

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
import { SelectAddress } from "@/lib/supabase/schema";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerInfoInput } from "../validations";
import CustomerInfoForm from "./CustomerInfoForm";

type CartItem = {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  material?: string | null;
};

type WhatsAppCheckoutButtonProps = {
  cartItems: CartItem[];
  disabled?: boolean;
  className?: string;
};

const GUEST_ADDRESS_KEY = "guest_last_address";

export function WhatsAppCheckoutButton({
  cartItems,
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
        // Auto-seleccionar la dirección predeterminada
        const defaultAddress = loadedAddresses.find(
          (a: SelectAddress) => a.isDefault,
        );
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
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
            address: created.fullAddress || "",
            notes: created.notes || "",
          };

          await handleSubmit(customerData, true);
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

    const customerData: CustomerInfoInput = {
      name: selectedAddress.recipientName,
      phone: selectedAddress.phone,
      zone: selectedAddress.zone,
      address: selectedAddress.fullAddress || "",
      notes: selectedAddress.notes || "",
    };

    handleSubmit(customerData);
  };

  const handleSubmit = async (
    customerData: CustomerInfoInput,
    _isNewAddress = false,
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItems,
          customerData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "INSUFFICIENT_STOCK") {
          toast({
            title: "Stock insuficiente",
            description:
              data.message || "Algunos productos no tienen stock disponible",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        throw new Error(data.message || "Error al crear la orden");
      }

      // Éxito - cerrar modal
      setIsOpen(false);

      // Mostrar mensaje de éxito
      toast({
        title: "¡Orden creada exitosamente!",
        description: `Tu orden ${data.orderNumber} ha sido reservada. Serás redirigido a WhatsApp.`,
      });

      // Disparar evento para que el carrito se recargue (se habrá limpiado en el backend)
      window.dispatchEvent(new Event("cart-updated"));

      // Redirigir a la página de confirmación
      router.push(
        `/orders/confirmation?orderId=${data.orderId}&orderNumber=${data.orderNumber}`,
      );

      // Abrir WhatsApp después de un pequeño delay
      setTimeout(() => {
        window.open(data.whatsappUrl, "_blank");
      }, 1500);
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
