"use client";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFormContext } from "react-hook-form";

type BadgeSelectFieldProps = {
  name: string;
  label: string;
};

function BadgeSelectField({ name, label }: BadgeSelectFieldProps) {
  const { setValue, control } = useFormContext();

  return (
    <FormField
      control={control}
      name="badge"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Etiqueta destacada</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sin etiqueta" />
              </SelectTrigger>
            </FormControl>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Etiqueta</SelectLabel>
                <SelectItem value="new_product">Nuevo</SelectItem>
                <SelectItem value="best_sale">Mejor venta</SelectItem>
                <SelectItem value="featured">Destacado</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <FormDescription>
            Opcional: aparece en la esquina de la tarjeta del producto.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default BadgeSelectField;
