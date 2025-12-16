"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectAddress } from "@/lib/supabase/schema";
import { useState } from "react";
import { AddressInput } from "../validations";
import { AddressCard } from "./AddressCard";
import { AddressForm } from "./AddressForm";

type AddressSelectorProps = {
  addresses: SelectAddress[];
  onSelectAddress: (address: SelectAddress) => void;
  onNewAddress: (data: AddressInput) => void;
  onModeChange?: (mode: "existing" | "new") => void;
  isLoading?: boolean;
};

export function AddressSelector({
  addresses,
  onSelectAddress,
  onNewAddress,
  onModeChange,
  isLoading = false,
}: AddressSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<"existing" | "new">(
    addresses.length > 0 ? "existing" : "new",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || null,
  );

  const handleModeChange = (mode: "existing" | "new") => {
    setSelectedMode(mode);
    onModeChange?.(mode);
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses.find((a) => a.id === addressId);
    if (address) {
      onSelectAddress(address);
    }
  };

  if (addresses.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No tienes direcciones guardadas. Completa los datos de entrega:
        </p>
        <AddressForm onSubmit={onNewAddress} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <RadioGroup
        value={selectedMode}
        onValueChange={(value) => handleModeChange(value as "existing" | "new")}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="existing" id="existing" />
          <Label htmlFor="existing" className="cursor-pointer">
            Usar una dirección guardada
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="new" />
          <Label htmlFor="new" className="cursor-pointer">
            Usar una nueva dirección
          </Label>
        </div>
      </RadioGroup>

      {/* Existing addresses */}
      {selectedMode === "existing" && (
        <div className="space-y-4">
          <RadioGroup
            value={selectedAddressId || ""}
            onValueChange={handleAddressSelect}
            className="space-y-3"
          >
            {addresses.map((address) => (
              <div key={address.id} className="relative">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={address.id}
                    id={address.id}
                    className="mt-4"
                  />
                  <Label htmlFor={address.id} className="cursor-pointer flex-1">
                    <AddressCard address={address} showActions={false} />
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* New address form */}
      {selectedMode === "new" && (
        <div className="space-y-4">
          <AddressForm
            onSubmit={onNewAddress}
            isLoading={isLoading}
            submitLabel="Usar esta dirección"
          />
        </div>
      )}
    </div>
  );
}

export default AddressSelector;
