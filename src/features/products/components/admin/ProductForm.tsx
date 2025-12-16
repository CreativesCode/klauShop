"use client";

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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@urql/next";
import { createInsertSchema } from "drizzle-zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { gql } from "urql";
import { z } from "zod";

type ProductsFormProps = {
  product?: SelectProducts;
  initialAdditionalImages?: string[];
};

type ProductFormData = Omit<InsertProducts, "additionalImages"> & {
  additionalImages?: string[];
};

const productFormSchema = createInsertSchema(products).extend({
  additionalImages: z.array(z.string()).optional(),
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
      featured: product?.featured ?? false,
      showInSlider: product?.showInSlider ?? false,
      additionalImages:
        initialAdditionalImages && initialAdditionalImages.length > 0
          ? initialAdditionalImages
          : [""],
    } as ProductFormData,
  });

  const { register, control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray({
    control: control as any,
    name: "additionalImages",
  });

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

        product
          ? await updateProductAction(product.id, cleanedData, filteredImages)
          : await createProductAction(cleanedData, filteredImages);

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
        className="gap-x-5 flex gap-y-5 flex-col px-3"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-y-5 max-w-[500px]">
          <FormItem>
            <FormLabel className="text-sm">Nombre*</FormLabel>
            <FormControl>
              <Input
                aria-invalid={!!form.formState.errors.name}
                placeholder="Ingrese el nombre del producto."
                {...register("name")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Slug*</FormLabel>
            <FormControl>
              <Input
                defaultValue={product?.slug}
                aria-invalid={!!form.formState.errors.slug}
                placeholder="Type Product slug."
                {...register("slug")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

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

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
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

          <FormItem>
            <FormLabel className="text-sm">Etiquetas</FormLabel>
            <FormControl>
              <TagsField name={"tags"} defaultValue={product?.tags || []} />
            </FormControl>
            <FormMessage />
          </FormItem>

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
              <TagsField name={"sizes"} defaultValue={product?.sizes || []} />
            </FormControl>
            <FormDescription>
              Agrega las tallas disponibles para este producto (ej: S, M, L, XL)
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
              Agrega los materiales disponibles para este producto (ej: Algodón,
              Poliéster)
            </FormDescription>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Precio*</FormLabel>
            <FormControl>
              <Input
                defaultValue={product?.price}
                aria-invalid={!!form.formState.errors.price}
                placeholder="Ingrese el precio del producto."
                {...register("price")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel className="text-sm">Stock*</FormLabel>
            <FormControl>
              <Input
                type="number"
                defaultValue={product?.stock ?? 0}
                aria-invalid={!!form.formState.errors.stock}
                placeholder="Stock quantity"
                {...register("stock", { valueAsNumber: true })}
              />
            </FormControl>
            <FormDescription>
              Cantidad de items disponibles en el inventario
            </FormDescription>
            <FormMessage />
          </FormItem>

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
                  Arrastre y suelte la imagen en la sección superior o haga clic
                  en el botón para seleccionar desde la galería de imágenes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel className="text-sm">Imágenes Adicionales</FormLabel>
            <div className="flex flex-col gap-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-x-2">
                  <FormField
                    control={control}
                    name={`additionalImages.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
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
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="flex-shrink-0"
                    >
                      <Icons.close className="h-4 w-4" />
                    </Button>
                  )}
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
              Agrega imágenes adicionales para el producto. La primera imagen se
              mostrará en la tarjeta del producto al pasar el cursor.
            </FormDescription>
          </FormItem>
        </div>

        <div className="py-8 flex gap-x-5 items-center">
          <Button disabled={isPending} variant={"outline"} form="project-form">
            {product ? "Actualizar" : "Crear"}
            {isPending && (
              <Spinner
                className="mr-2 h-4 w-4 animate-spin ml-2"
                aria-hidden="true"
              />
            )}
          </Button>
          <Link href="/admin/products" className={buttonVariants()}>
            Cancelar
          </Link>
        </div>
      </form>
    </Form>
  );
}

export default ProductFrom;
