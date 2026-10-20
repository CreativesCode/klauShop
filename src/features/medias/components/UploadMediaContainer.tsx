"use client";
import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { gql } from "@/gql";
import { useQuery } from "@urql/next";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { CropArea, prepareImageForUpload } from "../utils/prepareImage";
import { UploadItem, uploadMedia } from "../utils/uploadMedia";
import ImageCropDialog from "./ImageCropDialog";
import ImagesGrid from "./ImageGrid";
import ImageGridSkeleton from "./ImageGridSkeleton";

interface UploadMediaContainerProps {
  onClickItemsHandler: (mediaId: string) => void;
  defaultImageId?: string;
}
function UploadMediaContainer({
  onClickItemsHandler,
  defaultImageId,
}: UploadMediaContainerProps) {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  // Files waiting for the crop step, shown one at a time.
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropTotal, setCropTotal] = useState(0);
  const [lastCursor, setLastCursor] = React.useState<string | undefined>(
    undefined,
  );
  const [{ data, fetching, error }, refetch] = useQuery({
    query: MediasPageContentQuery,
    variables: {
      first: 16,
      after: lastCursor,
    },
  });

  const medias = data?.mediasCollection;

  // The media modal (edit/delete) is a route: refresh the grid when navigating back from it,
  // since urql's document cache doesn't know a media was deleted.
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    refetch({ requestPolicy: "network-only" });
  }, [pathname, refetch]);

  const updateUpload = (id: string, patch: Partial<UploadItem>) =>
    setUploads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const removeUpload = (id: string) =>
    setUploads((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((u) => u.id !== id);
    });

  const runUpload = async (item: UploadItem) => {
    updateUpload(item.id, {
      status: "preparing",
      progress: 0,
      error: undefined,
    });

    try {
      const prepared = await prepareImageForUpload(item.file, item.crop);

      // Show the cropped/optimized result instead of the original file.
      const preview = URL.createObjectURL(prepared);
      setUploads((prev) =>
        prev.map((u) => {
          if (u.id !== item.id) return u;
          URL.revokeObjectURL(u.preview);
          return { ...u, preview, status: "uploading" };
        }),
      );

      const mediaId = await uploadMedia(prepared, (progress) =>
        updateUpload(item.id, {
          progress,
          status: progress >= 100 ? "saving" : "uploading",
        }),
      );

      updateUpload(item.id, { status: "done", progress: 100, mediaId });
      refetch({ requestPolicy: "network-only" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo subir la imagen.";
      updateUpload(item.id, { status: "error", error: message });
      toast({
        title: `No se pudo subir "${item.file.name}"`,
        description: message,
        variant: "destructive",
      });
    }
  };

  const startUpload = (file: File, crop: CropArea | null) => {
    const item: UploadItem = {
      id: crypto.randomUUID(),
      file,
      crop,
      preview: URL.createObjectURL(file),
      status: "preparing",
      progress: 0,
    };
    setUploads((prev) => [item, ...prev]);
    runUpload(item);
  };

  const enqueueForCrop = (files: File[]) => {
    setCropTotal(
      cropQueue.length === 0 ? files.length : cropTotal + files.length,
    );
    setCropQueue((prev) => [...prev, ...files]);
  };

  const nextInCropQueue = () => setCropQueue((prev) => prev.slice(1));

  // Drop "done" tiles once the refetched grid already shows that media.
  useEffect(() => {
    if (!medias) return;
    const ids = new Set(medias.edges.map(({ node }) => node.id));
    setUploads((prev) => {
      const visible = prev.filter((u) => u.mediaId && ids.has(u.mediaId));
      if (visible.length === 0) return prev;
      visible.forEach((u) => URL.revokeObjectURL(u.preview));
      return prev.filter((u) => !visible.includes(u));
    });
  }, [medias]);

  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  useEffect(() => {
    return () =>
      uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.preview));
  }, []);

  const onDrop = (acceptedFiles: File[], rejections: FileRejection[]) => {
    if (rejections.length > 0) {
      toast({
        title: "Archivo no permitido",
        description: `Solo se pueden subir imágenes: ${rejections
          .map((r) => r.file.name)
          .join(", ")}`,
        variant: "destructive",
      });
    }

    // GIFs skip the crop step: the canvas would drop the animation.
    acceptedFiles
      .filter((file) => file.type === "image/gif")
      .forEach((file) => startUpload(file, null));
    const croppable = acceptedFiles.filter((file) => file.type !== "image/gif");
    if (croppable.length > 0) enqueueForCrop(croppable);
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div>
      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">
          No se pudieron cargar las imágenes: {error.message}
        </p>
      )}

      {fetching && !medias && <ImageGridSkeleton />}

      {medias && (
        <>
          <div className="rounded-[18px] border border-line bg-white p-4 md:p-5">
            <div {...getRootProps()} className="dropzone-container">
              <ImagesGrid
                medias={medias.edges}
                AddMediaButtonComponent={
                  <AddMediaButtonComponent open={open} />
                }
                uploads={uploads}
                onRetryUpload={runUpload}
                onDismissUpload={removeUpload}
                onClickHandler={onClickItemsHandler}
                defaultImageId={defaultImageId}
              />

              {medias.pageInfo.hasNextPage ? (
                <div className="flex justify-center pt-5">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLastCursor(medias.pageInfo.endCursor ?? undefined);
                    }}
                  >
                    Cargar más
                  </Button>
                </div>
              ) : null}

              <input {...getInputProps()} />
              {isDragActive ? (
                <div className="z-50 mt-4 flex min-h-[320px] w-full items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary-50 text-sm font-bold text-primary-700">
                  Arrastre la imagen aquí para subir la imagen.
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      <ImageCropDialog
        file={cropQueue[0] ?? null}
        position={cropTotal - cropQueue.length + 1}
        total={cropTotal}
        onUpload={(crop) => {
          startUpload(cropQueue[0], crop);
          nextInCropQueue();
        }}
        onUploadAllWithoutCrop={() => {
          cropQueue.forEach((file) => startUpload(file, null));
          setCropQueue([]);
        }}
        onDiscard={nextInCropQueue}
      />
    </div>
  );
}

const AddMediaButtonComponent = ({ open }: { open: () => void }) => {
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Subir imágenes"
      className="flex h-[120px] w-[120px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 text-xs font-bold text-neutral-500 transition-colors hover:border-primary hover:text-primary"
    >
      <Icons.add className="size-7" aria-hidden />
      Subir
    </button>
  );
};

export default UploadMediaContainer;

export const MediasPageContentQuery = gql(/* GraphQL */ `
  query MediasPageContentQuery($first: Int, $after: Cursor) {
    mediasCollection(
      first: $first
      after: $after
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      __typename
      edges {
        node {
          id
          key
          alt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
  }
`);
