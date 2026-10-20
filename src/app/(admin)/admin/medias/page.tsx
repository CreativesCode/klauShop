import AdminShell from "@/components/admin/AdminShell";
import { ImageGridSkeleton, MediasPageContent } from "@/features/medias";
import { Suspense } from "react";

type Props = {};

async function MediasPage({}: Props) {
  return (
    <AdminShell
      heading="Multimedia"
      description="Imágenes de productos y colecciones. Arrastra archivos aquí o pulsa «Subir»."
    >
      <Suspense fallback={<ImageGridSkeleton />}>
        <MediasPageContent />
      </Suspense>
    </AdminShell>
  );
}

export default MediasPage;
