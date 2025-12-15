"use client";

import { SelectAddress } from "@/lib/supabase/schema";
import { AddressCard } from "./AddressCard";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

type AddressListProps = {
  addresses: SelectAddress[];
  onEdit?: (address: SelectAddress) => void;
};

export function AddressList({ addresses, onEdit }: AddressListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (addressId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar la dirección");
      }

      toast({
        title: "Dirección eliminada",
        description: "La dirección ha sido eliminada exitosamente",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la dirección",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/addresses/${addressId}/set-default`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Error al establecer dirección predeterminada",
        );
      }

      toast({
        title: "Dirección actualizada",
        description: "Dirección predeterminada establecida exitosamente",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "No se pudo establecer la dirección como predeterminada",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (addresses.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg border-dashed">
        <p className="text-muted-foreground">
          No tienes direcciones guardadas todavía
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Crea tu primera dirección para agilizar tus pedidos
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

export default AddressList;
