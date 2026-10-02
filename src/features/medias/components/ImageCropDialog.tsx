"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import type { CropArea } from "../utils/prepareImage";

// Storefront shows products at 1:1 and collections at 16:9.
const ASPECT_OPTIONS = [
  { label: "Cuadrado", value: 1 },
  { label: "16:9", value: 16 / 9 },
  { label: "Original", value: null },
] as const;

type ImageCropDialogProps = {
  file: File | null;
  position: number;
  total: number;
  onUpload: (crop: CropArea | null) => void;
  onUploadAllWithoutCrop: () => void;
  onDiscard: () => void;
};

function ImageCropDialog({
  file,
  position,
  total,
  onUpload,
  onUploadAllWithoutCrop,
  onDiscard,
}: ImageCropDialogProps) {
  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onDiscard()}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>
            Recortar imagen{total > 1 ? ` (${position} de ${total})` : ""}
          </DialogTitle>
          <DialogDescription className="truncate">
            {file?.name}
          </DialogDescription>
        </DialogHeader>
        {file && (
          <CropEditor
            // Remount per file so zoom/crop state starts fresh.
            key={`${file.name}-${file.lastModified}-${position}`}
            file={file}
            hasMore={total - position > 0}
            onUpload={onUpload}
            onUploadAllWithoutCrop={onUploadAllWithoutCrop}
            onDiscard={onDiscard}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CropEditorProps = {
  file: File;
  hasMore: boolean;
  onUpload: (crop: CropArea | null) => void;
  onUploadAllWithoutCrop: () => void;
  onDiscard: () => void;
};

function CropEditor({
  file,
  hasMore,
  onUpload,
  onUploadAllWithoutCrop,
  onDiscard,
}: CropEditorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectIndex, setAspectIndex] = useState(0);
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const aspect = ASPECT_OPTIONS[aspectIndex].value ?? naturalAspect;

  return (
    <div className="space-y-4">
      <div className="relative h-[320px] sm:h-[400px] w-full overflow-hidden rounded-md bg-zinc-900">
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
            onMediaLoaded={({ naturalWidth, naturalHeight }) =>
              setNaturalAspect(naturalWidth / naturalHeight)
            }
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-2">
          {ASPECT_OPTIONS.map((option, index) => (
            <Button
              key={option.label}
              type="button"
              size="sm"
              variant={index === aspectIndex ? "default" : "outline"}
              onClick={() => setAspectIndex(index)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-3">
          <span className="text-sm text-muted-foreground">Zoom</span>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={([value]) => setZoom(value)}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onDiscard}>
          Descartar
        </Button>
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            onClick={onUploadAllWithoutCrop}
          >
            Subir todas sin recortar
          </Button>
        )}
        <Button type="button" variant="outline" onClick={() => onUpload(null)}>
          Subir sin recortar
        </Button>
        <Button
          type="button"
          disabled={!croppedArea}
          onClick={() => croppedArea && onUpload(croppedArea)}
        >
          Recortar y subir
        </Button>
      </DialogFooter>
    </div>
  );
}

export default ImageCropDialog;
