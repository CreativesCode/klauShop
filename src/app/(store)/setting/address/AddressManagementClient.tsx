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
import { AddressForm, AddressList } from "@/features/addresses/components";
import { AddressInput } from "@/features/addresses/validations";
import { SelectAddress } from "@/lib/supabase/schema";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AddressManagementClientProps = {
  initialAddresses: SelectAddress[];
};

export function AddressManagementClient({
  initialAddresses,
}: AddressManagementClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SelectAddress | null>(
    null,
  );
  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async (data: AddressInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al crear la dirección");
      }

      toast({
        title: "Dirección creada",
        description: "La dirección ha sido creada exitosamente",
      });

      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la dirección",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: AddressInput) => {
    if (!editingAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/addresses/${editingAddress.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar la dirección");
      }

      toast({
        title: "Dirección actualizada",
        description: "La dirección ha sido actualizada exitosamente",
      });

      setIsDialogOpen(false);
      setEditingAddress(null);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la dirección",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: SelectAddress) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingAddress(null);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva dirección
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Editar dirección" : "Nueva dirección"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Actualiza los datos de tu dirección de entrega"
                : "Agrega una nueva dirección de entrega"}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            onSubmit={editingAddress ? handleUpdate : handleCreate}
            isLoading={isLoading}
            initialData={
              editingAddress
                ? {
                    name: editingAddress.name,
                    recipientName: editingAddress.recipientName,
                    phone: editingAddress.phone,
                    zone: editingAddress.zone,
                    fullAddress: editingAddress.fullAddress,
                    notes: editingAddress.notes,
                    isDefault: editingAddress.isDefault,
                  }
                : undefined
            }
            submitLabel={editingAddress ? "Actualizar" : "Crear dirección"}
          />
        </DialogContent>
      </Dialog>

      <AddressList addresses={initialAddresses} onEdit={handleEdit} />
    </div>
  );
}
