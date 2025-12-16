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
                  <div className="h-32 w-32 bg-muted animate-pulse rounded-md" />
                }
              >
                <ImagePreviewCard
                  key={displayValue}
                  onClick={() => {}}
                  mediaId={displayValue}
                />
              </Suspense>
            ) : (
              <div className="h-32 w-32 border-2 border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                Seleccionar / Agregar Imagen
              </div>
            )}
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-[1080px] min-h-full md:min-h-[480px]">
          <DialogHeader>
            <DialogTitle className="mb-5">Image Gallery</DialogTitle>
            <Suspense
              fallback={
                <div className="h-64 w-full bg-muted animate-pulse rounded-md" />
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
