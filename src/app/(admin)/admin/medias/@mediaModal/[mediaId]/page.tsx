import { getMedia } from "@/_actions/medias";
import Modal from "@/components/ui/Modal";
import { UpdateMediaForm } from "@/features/medias";
// Server-only (DB access), so it is not re-exported from the client-facing index.
import { getMediaUsage } from "@/features/medias/server/getMediaUsage";
import { keytoUrl } from "@/lib/utils";
import Image from "next/image";

type Props = { params: { mediaId: string } };

async function EditMediaModals({ params: { mediaId } }: Props) {
  // TODO: Change from server Action to GrahpQL
  const media = await getMedia(mediaId);
  // The slot can be re-rendered after its media was deleted: render nothing instead of a 404.
  if (!media) return null;
  const usage = await getMediaUsage(media.id);

  return (
    <Modal header="Modificar Imagen" containerClassName="px-5">
      <div className="flex flex-col md:flex-row gap-y-5 gap-x-5">
        <div className="flex-1 w-[640px]">
          <Image
            src={keytoUrl(media.key)}
            alt={media.alt}
            width={640}
            height={640}
            className="max-w-[640px] w-full h-auto object-cover"
          />
        </div>
        <div className="border-t md:border-t-0 md:border-l border-zinc-600 pt-5">
          <UpdateMediaForm media={media} usage={usage} />
        </div>
      </div>
    </Modal>
  );
}

export default EditMediaModals;
