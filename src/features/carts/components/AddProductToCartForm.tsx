"use client";
import { Icons } from "@/components/layouts/icons";
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
  FormMessage,
} from "@/components/ui/form";

import { Spinner } from "@/components/ui/spinner";
import { ColorPicker } from "@/features/products/components/ColorPicker";
import { MaterialSelector } from "@/features/products/components/MaterialSelector";
import { getStockLabel } from "@/features/products/components/ProductStockDisplay";
import { SizeSelector } from "@/features/products/components/SizeSelector";
import { cn, formatCUP } from "@/lib/utils";
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
  /** Final unit price, shown in the mobile buy bar */
  price?: number;
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
  price,
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

  const isDisabled =
    !mounted ||
    isLoadingStock ||
    availableStock === 0 ||
    !areAllVariantsSelected;
  const submitLabel = mounted ? "Añadir al carrito" : "Cargando…";
  const stockInfo =
    availableStock !== null ? getStockLabel(availableStock) : null;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-[22px]"
      >
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

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className="flex flex-wrap items-center gap-3">
                <FormControl>
                  <QuantityInput
                    {...field}
                    addOneHandler={addOne}
                    minusOneHandler={minusOne}
                    maxValue={maxQuantity}
                  />
                </FormControl>
                <Button
                  type="submit"
                  size="xl"
                  elevated
                  className="min-w-[200px] flex-1"
                  disabled={isDisabled}
                >
                  {!mounted || isLoadingStock ? (
                    <Spinner className="size-4" aria-hidden="true" />
                  ) : (
                    <Icons.store className="size-[18px]" aria-hidden />
                  )}
                  {submitLabel}
                </Button>
              </div>
              {mounted && !areAllVariantsSelected && (
                <p className="mt-2 text-[13px] font-semibold text-neutral-500">
                  Elige tus opciones para añadirlo al carrito.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mobile buy bar (the store tab bar is hidden on product pages) */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur md:hidden">
          <div className="min-w-0">
            {price !== undefined && (
              <p className="text-[17px] font-extrabold tabular-nums text-ink">
                {formatCUP(price)}
              </p>
            )}
            <p
              className={cn(
                "truncate text-xs font-semibold",
                !areAllVariantsSelected
                  ? "text-neutral-500"
                  : stockInfo?.className ?? "text-neutral-500",
              )}
            >
              {!areAllVariantsSelected
                ? "Elige tus opciones"
                : stockInfo?.text ?? "Comprobando stock…"}
            </p>
          </div>
          <Button
            type="submit"
            className="h-[50px] flex-1 rounded-full text-[15px]"
            disabled={isDisabled}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default AddProductToCartForm;
