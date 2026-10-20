"use client";

import dynamic from "next/dynamic";
import { createProductAction, updateProductAction } from "@/_actions/products";
import { Icons } from "@/components/layouts/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ColorsField from "@/components/ui/colorsField";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import TagsField from "@/components/ui/tagsField";
import { useToast } from "@/components/ui/use-toast";
import { BadgeSelectField } from "@/features/cms";
import { ImageDialog } from "@/features/medias";
import {
  InsertProducts,
  SelectProducts,
  products,
} from "@/lib/supabase/schema";
import { formatCUP, slugify } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@urql/next";
import { createInsertSchema } from "drizzle-zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { gql } from "urql";
import { z } from "zod";
import { DeleteProductDialog } from "./DeleteProductDialog";

// react-quill touches `document` on import: load it only in the browser
const RichTextEditor = dynamic(
  () =>
    import("@/components/ui/rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false },
);

type ProductsFormProps = {
  product?: SelectProducts;
  initialAdditionalImages?: string[];
};

type ProductFormData = Omit<InsertProducts, "additionalImages"> & {
  additionalImages?: string[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Spanish messages and business rules on top of the table schema
const productFormSchema = createInsertSchema(products).extend({
  additionalImages: z.array(z.string()).optional(),
  name: z
    .string({ required_error: "Escribe el nombre" })
    .trim()
    .min(1, "Escribe el nombre")
    .max(191, "Máximo 191 caracteres"),
  slug: z
    .string({ required_error: "Escribe el slug o genéralo desde el nombre" })
    .trim()
    .min(1, "Escribe el slug o genéralo desde el nombre")
    .max(191, "Máximo 191 caracteres")
    .regex(
      SLUG_PATTERN,
      "Solo minúsculas, números y guiones (ej. vestido-rojo)",
    ),
  price: z
    .string({ required_error: "Escribe el precio" })
    .trim()
    .refine((v) => Number(v) > 0, "El precio debe ser mayor que 0"),
  discount: z
    .string()
    .nullable()
    .optional()
    .refine(
      (v) => !v || (Number(v) >= 0 && Number(v) <= 100),
      "El descuento va de 0 a 100",
    ),
  stock: z
    .number({
      required_error: "Escribe el stock",
      invalid_type_error: "Escribe el stock",
    })
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
  featuredImageId: z
    .string({ required_error: "Elige una imagen destacada" })
    .min(1, "Elige una imagen destacada"),
});

export const ProductFormQuery = gql(/* GraphQL */ `
  query ProductFormQuery {
    collectionsCollection(orderBy: [{ label: AscNullsLast }]) {
      __typename
      edges {
        node {
          id
          label
        }
      }
    }
  }
`);

function ProductFrom({
  product,
  initialAdditionalImages = [],
}: ProductsFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [{ data }] = useQuery({
    query: ProductFormQuery,
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...product,
      stock: product?.stock ?? 0,
      featured: product?.featured ?? false,
      showInSlider: product?.showInSlider ?? false,
      additionalImages:
        initialAdditionalImages && initialAdditionalImages.length > 0
          ? initialAdditionalImages
          : [""],
    } as ProductFormData,
  });

  const { register, control, handleSubmit, setValue, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control: control as any,
    name: "additionalImages",
  });

  // Observar cambios en precio y descuento para calcular el precio final
  const price = useWatch({ control, name: "price" });
  const discount = useWatch({ control, name: "discount" });
  const name = watch("name");

  // Función para generar el slug basado en el nombre
  const generateSlug = () => {
    if (name && typeof name === "string" && name.trim() !== "") {
      const generatedSlug = slugify(name);
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  };

  // Calcular el precio final con descuento
  const calculateFinalPrice = () => {
    const priceValue = parseFloat(price?.toString() || "0");
    const discountValue = parseFloat(discount?.toString() || "0");

    if (priceValue <= 0) return 0;

    if (discountValue > 0) {
      return priceValue - (priceValue * discountValue) / 100;
    }

    return priceValue;
  };

  const finalPrice = calculateFinalPrice();
  const hasDiscount = parseFloat(discount?.toString() || "0") > 0;

  const onSubmit = handleSubmit(async (data) => {
    startTransition(async () => {
      try {
        // Separar las imágenes adicionales del resto de los datos
        const { additionalImages = [], ...productData } = data;

        // Limpiar los datos antes de enviarlos
        const cleanedData: InsertProducts = {
          ...productData,
          // Convertir rating vacío a null o valor por defecto
          rating:
            productData.rating === "" ||
            productData.rating === null ||
            productData.rating === undefined
              ? "4"
              : String(productData.rating),
          // Asegurar que los arrays opcionales sean null si están vacíos
          colors:
            productData.colors && productData.colors.length > 0
              ? productData.colors
              : null,
          sizes:
            productData.sizes && productData.sizes.length > 0
              ? productData.sizes
              : null,
          materials:
            productData.materials && productData.materials.length > 0
              ? productData.materials
              : null,
        };

        // Filtrar imágenes adicionales vacías
        const filteredImages = (additionalImages || []).filter(
          (img) => img && typeof img === "string" && img.trim() !== "",
        );

        const result = product
          ? await updateProductAction(
              product.id,
              cleanedData,
              filteredImages,
              product.stock ?? null,
            )
          : await createProductAction(cleanedData, filteredImages);

        if (result && "error" in result) {
          toast({
            title: "No se guardó",
            description: result.error,
            variant: "destructive",
          });
          return;
        }

        router.push("/admin/products");
        router.refresh();

        toast({
          title: `Producto ${product ? "actualizado" : "creado"}.`,
          description: `${productData.name}`,
        });
      } catch (err) {
        console.error("Error creating/updating product:", err);
        toast({
          title: "Error",
          description: "Ocurrió un error al guardar el producto.",
          variant: "destructive",
        });
      }
    });
  });

  return (
    <Form {...form}>
      <form
        id="project-form"
        className="flex flex-col gap-[18px]"
        onSubmit={onSubmit}
      >
        <div className="flex flex-wrap items-start gap-[18px]">
          <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-[18px]">
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">
                  Información
                </h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Nombre, enlace y descripción que ve el cliente.
                </p>
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nombre*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre del producto"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Slug*</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input
                          placeholder="vestido-rojo"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSlug}
                        disabled={!name || name.trim() === ""}
                        className="size-[46px] shrink-0"
                        title="Generar slug desde el nombre"
                      >
                        <Icons.refresh className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Descripción*</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Escribe la descripción del producto..."
                        error={!!form.formState.errors.description}
                      />
                    </FormControl>
                    <FormDescription>
                      Escribe una descripción detallada del producto con formato
                      enriquecido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">
                  Imágenes
                </h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  La imagen destacada se muestra en la tarjeta del producto.
                </p>
              </div>
              <FormField
                control={form.control}
                name="featuredImageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen Destacada*</FormLabel>
                    <Suspense>
                      <ImageDialog
                        defaultValue={product?.featuredImageId}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </Suspense>

                    <FormDescription>
                      Arrastre y suelte la imagen en la sección superior o haga
                      clic en el botón para seleccionar desde la galería de
                      imágenes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel className="text-sm">Imágenes Adicionales</FormLabel>
                <div className="flex flex-col gap-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-x-3">
                      <div className="flex-1">
                        <FormField
                          control={control}
                          name={`additionalImages.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Suspense>
                                  <ImageDialog
                                    defaultValue={field.value || undefined}
                                    onChange={field.onChange}
                                    value={field.value || undefined}
                                  />
                                </Suspense>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (fields.length === 1) {
                            // Si es el último campo, solo limpiar el valor en lugar de eliminar
                            setValue(`additionalImages.${index}`, "", {
                              shouldValidate: false,
                            });
                          } else {
                            // Si hay más campos, eliminar este
                            remove(index);
                          }
                        }}
                        className="flex-shrink-0 mt-0"
                        title="Eliminar imagen"
                        aria-label="Eliminar imagen"
                      >
                        <Icons.close className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append("")}
                    className="w-full"
                  >
                    <Icons.add className="h-4 w-4 mr-2" />
                    Agregar otra imagen
                  </Button>
                </div>
                <FormDescription>
                  Agrega imágenes adicionales para el producto. La primera
                  imagen se mostrará en la tarjeta del producto al pasar el
                  cursor.
                </FormDescription>
              </FormItem>
            </section>
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">
                  Variantes
                </h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Colores, tallas y materiales que el cliente puede elegir.
                </p>
              </div>
              <FormItem>
                <FormLabel className="text-sm">Colores</FormLabel>
                <FormControl>
                  <ColorsField
                    name={"colors"}
                    defaultValue={product?.colors || []}
                  />
                </FormControl>
                <FormDescription>
                  Agrega colores disponibles para este producto en formato
                  hexadecimal
                </FormDescription>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel className="text-sm">Tallas</FormLabel>
                <FormControl>
                  <TagsField
                    name={"sizes"}
                    defaultValue={product?.sizes || []}
                  />
                </FormControl>
                <FormDescription>
                  Agrega las tallas disponibles para este producto (ej: S, M, L,
                  XL)
                </FormDescription>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel className="text-sm">Materiales</FormLabel>
                <FormControl>
                  <TagsField
                    name={"materials"}
                    defaultValue={product?.materials || []}
                  />
                </FormControl>
                <FormDescription>
                  Agrega los materiales disponibles para este producto (ej:
                  Algodón, Poliéster)
                </FormDescription>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel className="text-sm">Etiquetas</FormLabel>
                <FormControl>
                  <TagsField name={"tags"} defaultValue={product?.tags || []} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </section>
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">
                  Precio y stock
                </h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  El descuento se aplica sobre el precio.
                </p>
              </div>
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Precio (CUP)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="Precio del producto"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Descuento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="Ingrese el descuento del producto."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Porcentaje de descuento (0-100). Por defecto: 0 (sin
                      descuento)
                    </FormDescription>
                    {hasDiscount && (
                      <div className="mt-2 rounded-xl bg-emerald-50 px-3.5 py-2.5">
                        <div className="text-sm text-emerald-800">
                          <span className="font-medium">
                            Precio final con descuento:
                          </span>
                          <span className="ml-2 text-lg font-bold">
                            {formatCUP(finalPrice)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-emerald-700">
                          Descuento aplicado:{" "}
                          {parseFloat(discount?.toString() || "0").toFixed(2)}%
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Stock*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder="Cantidad en inventario"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : e.target.valueAsNumber,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Cantidad de items disponibles en el inventario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">
                  Organización
                </h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Colección, insignia y visibilidad en la tienda.
                </p>
              </div>
              <Suspense>
                {data && data.collectionsCollection && (
                  <FormField
                    control={control}
                    name={"collectionId"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"Colecciones"}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una colección" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {data.collectionsCollection.edges.map(
                              ({ node: collection }) => (
                                <SelectItem
                                  value={collection.id}
                                  key={collection.id}
                                >
                                  {collection.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {"Seleccione una colección para el producto."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </Suspense>
              <BadgeSelectField name="badge" label={""} />
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-line p-4">
                    <FormControl>
                      <Checkbox
                        defaultChecked={product?.featured || false}
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Destacado</FormLabel>
                      <FormDescription>
                        Marca este producto como destacado
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showInSlider"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-line p-4">
                    <FormControl>
                      <Checkbox
                        defaultChecked={product?.showInSlider || false}
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mostrar en Slider</FormLabel>
                      <FormDescription>
                        Marca este producto para que aparezca en el slider de
                        productos
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Rating*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="Rating (0-5)"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "4" : value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Rating del producto (0-5). Por defecto: 4
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          </div>
        </div>

        <div className="sticky bottom-[calc(65px+env(safe-area-inset-bottom))] z-10 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-[18px] lg:border">
          <Link
            href="/admin/products"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
          <div className="flex items-center gap-2">
            {product && (
              <DeleteProductDialog
                productId={product.id}
                productName={product.name}
              />
            )}
            <Button disabled={isPending} form="project-form" type="submit">
              {isPending && (
                <Spinner className="size-4 animate-spin" aria-hidden="true" />
              )}
              {product ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default ProductFrom;
