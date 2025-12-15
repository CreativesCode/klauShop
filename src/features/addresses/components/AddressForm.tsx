"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AddressInput, addressSchema } from "../validations";

type AddressFormProps = {
  onSubmit: (data: AddressInput) => void;
  isLoading?: boolean;
  initialData?: Partial<AddressInput>;
  submitLabel?: string;
};

export function AddressForm({
  onSubmit,
  isLoading = false,
  initialData,
  submitLabel = "Guardar dirección",
}: AddressFormProps) {
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: initialData?.name || "",
      recipientName: initialData?.recipientName || "",
      phone: initialData?.phone || "",
      zone: initialData?.zone || "",
      fullAddress: initialData?.fullAddress || "",
      notes: initialData?.notes || "",
      isDefault: initialData?.isDefault || false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la dirección *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Casa, Trabajo, etc."
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Un nombre para identificar esta dirección
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo del destinatario *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Juan Pérez"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono *</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 234 567 8901"
                  type="tel"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Incluye código de país si es necesario
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="zone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona de entrega *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Santa Clara, Placetas..."
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Zonas disponibles: {siteConfig.zones}. Si usted es de otra zona,
                insértela e intentaremos ponernos de acuerdo para entregársela.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección completa (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Calle, número, referencias..."
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas adicionales (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Preferencias de entrega, instrucciones especiales..."
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Establecer como dirección predeterminada</FormLabel>
                <FormDescription>
                  Esta dirección se usará automáticamente en tus pedidos
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}

export default AddressForm;
