"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createInsertSchema } from "drizzle-zod";
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

import { InsertCollection, collections } from "@/lib/supabase/schema";

import {
  createCollectionAction,
  updateCollectionAction,
} from "@/_actions/collections";
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
    resolver: zodResolver(createInsertSchema(collections)),
    defaultValues: {
      ...collection,
      featuredImageId: collection ? collection.featured_image_id : undefined,
      parentId: collection?.parent_id || undefined,
      showInHome: collection?.show_in_home || false,
    },
  });

  const { register, handleSubmit } = form;

  const onSubmit = handleSubmit(async (data: InsertCollection) => {
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
        className="gap-x-5 flex gap-y-5 flex-col px-3"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-y-5 max-w-[500px]">
          <FormItem>
            <FormLabel className="text-sm">Label*</FormLabel>
            <FormControl>
              <Input
                aria-invalid={!!form.formState.errors.label}
                placeholder="Ingrese el label de la colección."
                {...register("label")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem>
            <FormLabel className="text-sm">Título*</FormLabel>
            <FormControl>
              <Input
                aria-invalid={!!form.formState.errors.title}
                placeholder="Ingrese el título de la colección."
                {...register("title")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Slug*</FormLabel>
            <FormControl>
              <Input
                defaultValue={collection?.slug}
                aria-invalid={!!form.formState.errors.slug}
                placeholder="Ingrese el slug de la colección."
                {...register("slug")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Descripción*</FormLabel>
            <FormControl>
              <Textarea
                defaultValue={collection?.description}
                aria-invalid={!!form.formState.errors.description}
                placeholder="Ingrese la descripción de la colección."
                {...register("description")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormField
            control={form.control}
            name="featuredImageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagen Destacada*</FormLabel>
                <Suspense
                  fallback={
                    <div className="h-32 w-full bg-muted animate-pulse rounded-md" />
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
                  Arrastre y suelte la imagen en la sección anterior o haga clic
                  en el botón para seleccionar desde la galería de imágenes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                  jerárquica. Deje como &quot;Ninguno&quot; para las colecciones
                  de nivel raíz.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showInHome"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Mostrar en el Home</FormLabel>
                  <FormDescription>
                    Marca esta opción si quieres que esta categoría aparezca en
                    el listado de categorías del home.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="py-8 flex gap-x-5 items-center justify-between">
          <div className="flex gap-x-5 items-center">
            <Link
              href="/admin/collections"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancelar
            </Link>
          </div>
          <div className="flex gap-x-5 items-center">
            {collection && (
              <DeleteCollectionDialog
                collectionId={collection.id}
                collectionName={collection.label}
              />
            )}
            <Button disabled={isPending} form="project-form" type="submit">
              {collection ? "Actualizar" : "Crear"}
              {isPending && (
                <Spinner
                  className="mr-2 h-4 w-4 animate-spin ml-2"
                  aria-hidden="true"
                />
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default CollectionForm;
