"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import ImagePreviewCard from "@/features/medias/components/ImagePreviewCard";
import React, { Suspense } from "react";
import UploadMediaContainer from "./UploadMediaContainer";

type ImageDialogProps = {
  onChange: (data: string) => void;
  defaultValue?: string;
  multiple?: boolean;
  modalOpen?: boolean;
  value?: string;
};

function ImageDialog({
  modalOpen = false,
  onChange,
  value,
  defaultValue,
}: ImageDialogProps) {
  const [dialogOpen, setDialogOpen] = React.useState(modalOpen);
  // const { control, setError, getValues, setValue } = useFormContext()
  // const { fields, remove, append, update, move, swap } = useFieldArray({
  //   control,
  //   name: "",
  // })
  const onClickHandler = (mediaId: string) => {
    onChange(mediaId);
    setDialogOpen(false);
  };

  const displayValue = value || defaultValue;

  return (
    <div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger>
          <div>
            {displayValue ? (
              <Suspense
                fallback={
                  <div className="h-32 w-32 animate-pulse rounded-xl bg-surface-soft" />
                }
              >
                <ImagePreviewCard
                  key={displayValue}
                  onClick={() => {}}
                  mediaId={displayValue}
                />
              </Suspense>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 px-2 text-center text-[13px] font-bold text-neutral-500 transition-colors hover:border-primary hover:text-primary">
                Elegir o subir imagen
              </div>
            )}
          </div>
        </DialogTrigger>

        {/* Fits the phone screen and scrolls: the close button and the upload tile stay reachable */}
        <DialogContent className="max-w-[1080px] max-h-[90dvh] overflow-y-auto grid-cols-1 md:min-h-[480px]">
          <DialogHeader>
            <DialogTitle className="mb-5">Galería de imágenes</DialogTitle>
            <Suspense
              fallback={
                <div className="h-64 w-full animate-pulse rounded-xl bg-surface-soft" />
              }
            >
              <UploadMediaContainer
                onClickItemsHandler={onClickHandler}
                defaultImageId={defaultValue}
              />
            </Suspense>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImageDialog;
