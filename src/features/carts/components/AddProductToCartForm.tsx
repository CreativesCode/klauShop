"use client";
import { QuantityInput } from "@/components/layouts/QuantityInput";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Spinner } from "@/components/ui/spinner";
import { ColorPicker } from "@/features/products/components/ColorPicker";
import { MaterialSelector } from "@/features/products/components/MaterialSelector";
import { SizeSelector } from "@/features/products/components/SizeSelector";
import { useAuth } from "@/providers/AuthProvider";
import useCartActions from "../hooks/useCartActions";
import { AddProductCartData, AddProductToCartSchema } from "../validations";

interface AddProductToCartFormProps {
  productId: string;
  colors?: string[] | null;
  sizes?: string[] | null;
  materials?: string[] | null;
  // Shared with the stock header (ProductStockAndFormWrapper)
  availableStock: number | null;
  isLoadingStock?: boolean;
  onVariantChange?: {
    color?: (color: string | undefined) => void;
    size?: (size: string | undefined) => void;
    material?: (material: string | undefined) => void;
  };
}

function AddProductToCartForm({
  productId,
  colors,
  sizes,
  materials,
  availableStock,
  isLoadingStock = false,
  onVariantChange,
}: AddProductToCartFormProps) {
  const { user } = useAuth();
  const { addProductToCart } = useCartActions(user, productId);
  // Before hydration a submit would do a native GET (page reload, nothing added)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const form = useForm<AddProductCartData>({
    resolver: zodResolver(AddProductToCartSchema),
    defaultValues: {
      quantity: 1,
      color: undefined,
      size: undefined,
      material: undefined,
    },
  });

  // Observar los valores actuales del formulario
  const selectedColor = form.watch("color");
  const selectedSize = form.watch("size");
  const selectedMaterial = form.watch("material");

  // Notificar cambios en las variantes
  useEffect(() => {
    onVariantChange?.color?.(selectedColor);
  }, [selectedColor, onVariantChange]);

  useEffect(() => {
    onVariantChange?.size?.(selectedSize);
  }, [selectedSize, onVariantChange]);

  useEffect(() => {
    onVariantChange?.material?.(selectedMaterial);
  }, [selectedMaterial, onVariantChange]);

  // Validar que todas las variantes disponibles estén seleccionadas
  const hasColors = colors && colors.length > 0;
  const hasSizes = sizes && sizes.length > 0;
  const hasMaterials = materials && materials.length > 0;

  const isColorValid = !hasColors || (hasColors && selectedColor !== undefined);
  const isSizeValid = !hasSizes || (hasSizes && selectedSize !== undefined);
  const isMaterialValid =
    !hasMaterials || (hasMaterials && selectedMaterial !== undefined);

  const areAllVariantsSelected = isColorValid && isSizeValid && isMaterialValid;

  // Limitar la cantidad máxima al stock disponible o 8 (lo que sea menor)
  const maxQuantity = availableStock !== null ? Math.min(availableStock, 8) : 8;

  async function onSubmit(values: AddProductCartData) {
    addProductToCart(
      values.quantity,
      values.color,
      values.size,
      values.material,
    );
  }

  const addOne = () => {
    const currQuantity = form.getValues("quantity");
    if (currQuantity < maxQuantity) form.setValue("quantity", currQuantity + 1);
  };
  const minusOne = () => {
    const currQuantity = form.getValues("quantity");
    if (currQuantity > 1) form.setValue("quantity", currQuantity - 1);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        {colors && colors.length > 0 && (
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ColorPicker
                    colors={colors}
                    selectedColor={field.value || undefined}
                    onColorSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {sizes && sizes.length > 0 && (
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SizeSelector
                    sizes={sizes}
                    selectedSize={field.value || undefined}
                    onSizeSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {materials && materials.length > 0 && (
          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MaterialSelector
                    materials={materials}
                    selectedMaterial={field.value || undefined}
                    onMaterialSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-end gap-x-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Cantidad</FormLabel>
                <div className="flex items-center gap-x-2">
                  <FormControl>
                    <QuantityInput
                      {...field}
                      addOneHandler={addOne}
                      minusOneHandler={minusOne}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    disabled={
                      !mounted ||
                      isLoadingStock ||
                      availableStock === 0 ||
                      !areAllVariantsSelected
                    }
                  >
                    {(!mounted || isLoadingStock) && (
                      <Spinner className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {mounted ? "Añadir al carrito" : "Cargando…"}
                  </Button>
                </div>
                {availableStock !== null && (
                  <p
                    className={`text-xs mt-1 ${
                      availableStock === 0
                        ? "text-red-500"
                        : availableStock <= 5
                          ? "text-orange-500"
                          : "text-gray-500"
                    }`}
                  >
                    {availableStock === 0
                      ? "Sin stock disponible"
                      : availableStock === 1
                        ? "¡Solo 1 unidad disponible!"
                        : availableStock <= 5
                          ? `¡Solo ${availableStock} unidades disponibles!`
                          : `${availableStock} unidades disponibles`}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}

export default AddProductToCartForm;
