"use client";
import { Icons } from "@/components/layouts/icons";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { DocumentType, gql } from "@/gql";
import { cn, keytoUrl } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";
import { UploadItem } from "../utils/uploadMedia";

type ImagesGridProps = {
  AddMediaButtonComponent?: ReactNode;
  UploadingMediaComponent?: ReactNode;
  containerClassName?: string;
  defaultImageId?: string;
  onClickHandler?: (mediaId: string) => void;
  uploads?: UploadItem[];
  onRetryUpload?: (upload: UploadItem) => void;
  onDismissUpload?: (uploadId: string) => void;
  medias: { node: DocumentType<typeof ImageGridFragment> }[];
};

function ImagesGrid({
  AddMediaButtonComponent,
  containerClassName,
  onClickHandler,
  defaultImageId,
  medias,
  UploadingMediaComponent,
  uploads = [],
  onRetryUpload,
  onDismissUpload,
}: ImagesGridProps) {
  return (
    <div
      className={cn(
        "grid max-w-[1200px] mx-auto gap-x-3 gap-y-5 grid-cols-[repeat(auto-fill,120px)] justify-center",
        containerClassName,
      )}
    >
      {AddMediaButtonComponent}
      {UploadingMediaComponent}

      {uploads.map((upload) => (
        <UploadTile
          key={upload.id}
          upload={upload}
          onSelect={onClickHandler}
          onRetry={onRetryUpload}
          onDismiss={onDismissUpload}
        />
      ))}

      {medias.map(({ node: media }) => (
        <button
          key={media.id}
          type="button"
          className={cn(
            "object-center group relative h-[120px] w-[120px]",
            defaultImageId === media.id && "ring-offset-2 ring-2",
          )}
          onClick={() => onClickHandler(media.id)}
        >
          <Image
            src={keytoUrl(media.key)}
            alt={media.alt}
            width={120}
            height={120}
            className={cn(
              "group-hover:opacity-30 transition-all duration-300 h-[120px] w-[120px] object-cover",
            )}
          />
        </button>
      ))}
    </div>
  );
}

const STATUS_LABEL: Record<UploadItem["status"], string> = {
  preparing: "Optimizando...",
  uploading: "Subiendo",
  saving: "Guardando...",
  done: "Subida",
  error: "Error",
};

type UploadTileProps = {
  upload: UploadItem;
  onSelect?: (mediaId: string) => void;
  onRetry?: (upload: UploadItem) => void;
  onDismiss?: (uploadId: string) => void;
};

function UploadTile({ upload, onSelect, onRetry, onDismiss }: UploadTileProps) {
  const { status, progress, error, mediaId, preview, file } = upload;
  const isError = status === "error";
  const isDone = status === "done";

  return (
    <div
      className={cn(
        "relative h-[120px] w-[120px] overflow-hidden rounded-sm border",
        isError ? "border-destructive" : "border-zinc-300",
      )}
      title={isError ? error : file.name}
    >
      <Image
        width={120}
        height={120}
        src={preview}
        alt={file.name}
        unoptimized
        className={cn(
          "h-[120px] w-[120px] object-cover",
          !isDone && "opacity-40",
        )}
      />

      {isDone && mediaId ? (
        <button
          type="button"
          onClick={() => onSelect?.(mediaId)}
          className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-green-600/90 py-1 text-xs font-medium text-white"
        >
          <Check className="h-3 w-3" /> {STATUS_LABEL.done}
        </button>
      ) : isError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/80 p-1 text-center">
          <p className="line-clamp-3 text-[10px] leading-tight text-destructive">
            {error}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onRetry?.(upload)}
              className="rounded bg-primary px-2 py-0.5 text-[10px] text-primary-foreground"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => onDismiss?.(upload.id)}
              aria-label="Quitar"
              className="rounded border px-1 text-zinc-600"
            >
              <Icons.close className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
          aria-live="polite"
        >
          {status === "uploading" ? (
            <>
              <span className="text-xs font-medium">
                {STATUS_LABEL.uploading} {progress}%
              </span>
              <Progress value={progress} className="h-1.5" />
            </>
          ) : (
            <>
              <Spinner />
              <span className="text-xs font-medium">
                {STATUS_LABEL[status]}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ImagesGrid;

export const ImageGridFragment = gql(/* GraphQL */ `
  fragment ImageGridFragment on medias {
    id
    key
    alt
  }
`);
