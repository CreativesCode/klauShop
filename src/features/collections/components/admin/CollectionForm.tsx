"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { InsertCollection } from "@/lib/supabase/schema";
import { collectionFormSchema } from "../../validations";

import {
  createCollectionAction,
  updateCollectionAction,
} from "@/_actions/collections";
import { Icons } from "@/components/layouts/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ImageDialog } from "@/features/medias";
import { DocumentType, gql } from "@/gql";
import { slugify } from "@/lib/utils";
import { useQuery } from "@urql/next";
import { nanoid } from "nanoid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteCollectionDialog } from "./DeleteCollectionDialog";

const CollectionFromFragment = gql(/* GraphQL */ `
  fragment CollectionFromFragment on collections {
    id
    slug
    label
    description
    title
    featured_image_id
    parent_id
    show_in_home
  }
`);

const CollectionsQuery = gql(/* GraphQL */ `
  query CollectionsQuery {
    collectionsCollection(orderBy: [{ label: AscNullsLast }]) {
      edges {
        node {
          id
          label
        }
      }
    }
  }
`);

type CollectionEdge = {
  node: {
    id: string;
    label: string;
  };
};

function ParentCollectionSelect({
  value,
  onChange,
  excludeId,
  disabled,
  collections,
  fetching,
  error,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  excludeId?: string;
  disabled?: boolean;
  collections: CollectionEdge[];
  fetching: boolean;
  error?: any;
}) {
  const filteredCollections = collections.filter(
    ({ node: parentCollection }) => parentCollection.id !== excludeId,
  );

  return (
    <Select
      onValueChange={(val) => onChange(val === "none" ? null : val)}
      value={value || "none"}
      disabled={disabled || fetching}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Seleccione una colección padre (opcional)" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="none">Ninguno (Colección Raíz)</SelectItem>
        {error ? (
          <SelectItem value="error" disabled>
            Error al cargar las colecciones
          </SelectItem>
        ) : fetching && collections.length === 0 ? (
          <SelectItem value="loading" disabled>
            Cargando colecciones...
          </SelectItem>
        ) : (
          filteredCollections.map(({ node: parentCollection }) => (
            <SelectItem value={parentCollection.id} key={parentCollection.id}>
              {parentCollection.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

type CollectionFormProps = {
  collection?: DocumentType<typeof CollectionFromFragment>;
};

function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  // Query collections once at the parent level
  const [{ data, fetching, error }] = useQuery({
    query: CollectionsQuery,
    requestPolicy: "cache-first",
  });

  const collectionsList = data?.collectionsCollection?.edges || [];

  const form = useForm<InsertCollection>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      ...collection,
      featuredImageId: collection ? collection.featured_image_id : undefined,
      parentId: collection?.parent_id || undefined,
      showInHome: collection?.show_in_home || false,
    },
  });

  const { register, handleSubmit, setValue, watch } = form;
  const label = watch("label");

  // Función para generar el slug basado en el label
  const generateSlug = () => {
    if (label && typeof label === "string" && label.trim() !== "") {
      const generatedSlug = slugify(label);
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const data = values as InsertCollection;
    setIsPending(true);
    try {
      if (collection) {
        await updateCollectionAction(collection.id, data);
        setIsPending(false);
        router.push("/admin/collections");
        router.refresh();
        toast({ title: "Colección actualizada correctamente." });
      } else {
        await createCollectionAction({
          ...data,
          id: nanoid(),
        });
        setIsPending(false);
        router.push("/admin/collections");
        router.refresh();
        toast({ title: "Colección creada correctamente." });
      }
    } catch (error) {
      setIsPending(false);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al guardar la colección.",
        variant: "destructive",
      });
    }
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
                  Nombre, título y descripción de la colección.
                </p>
              </div>
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      Nombre corto (label)*
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Ropa de mujer"
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Título*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Título que se muestra en la colección"
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
                          placeholder="ropa-de-mujer"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSlug}
                        disabled={!label || label.trim() === ""}
                        className="size-[46px] shrink-0"
                        title="Generar slug desde el label"
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
                      <Textarea
                        placeholder="Descripción de la colección"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">Imagen</h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Se usa en el banner y en las tarjetas de categoría.
                </p>
              </div>
              <FormField
                control={form.control}
                name="featuredImageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen Destacada*</FormLabel>
                    <Suspense
                      fallback={
                        <div className="h-32 w-full animate-pulse rounded-xl bg-surface-soft" />
                      }
                    >
                      <div className="">
                        <ImageDialog
                          defaultValue={collection?.featured_image_id}
                          onChange={field.onChange}
                          value={field.value || undefined}
                        />
                      </div>
                    </Suspense>

                    <FormDescription>
                      Arrastre y suelte la imagen en la sección anterior o haga
                      clic en el botón para seleccionar desde la galería de
                      imágenes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px]">
            <section className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-5">
              <div>
                <h2 className="text-[15px] font-extrabold text-ink">
                  Organización
                </h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  Ubicación en el menú y visibilidad en el inicio.
                </p>
              </div>
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colección Padre</FormLabel>
                    <ParentCollectionSelect
                      value={field.value}
                      onChange={field.onChange}
                      excludeId={collection?.id}
                      collections={collectionsList}
                      fetching={fetching}
                      error={error}
                    />
                    <FormDescription>
                      Seleccione una colección padre para crear una estructura
                      jerárquica. Deje como &quot;Ninguno&quot; para las
                      colecciones de nivel raíz.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showInHome"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-line p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mostrar en el inicio</FormLabel>
                      <FormDescription>
                        Marca esta opción si quieres que esta categoría aparezca
                        en el listado de categorías del inicio.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </section>
          </div>
        </div>

        <div className="sticky bottom-[calc(65px+env(safe-area-inset-bottom))] z-10 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-[18px] lg:border">
          <Link
            href="/admin/collections"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
          <div className="flex items-center gap-2">
            {collection && (
              <DeleteCollectionDialog
                collectionId={collection.id}
                collectionName={collection.label}
              />
            )}
            <Button disabled={isPending} form="project-form" type="submit">
              {isPending && (
                <Spinner className="size-4 animate-spin" aria-hidden="true" />
              )}
              {collection ? "Guardar cambios" : "Crear colección"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default CollectionForm;
