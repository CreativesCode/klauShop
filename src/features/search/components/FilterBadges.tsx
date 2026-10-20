"use client";
import { Icons } from "@/components/layouts/icons";
import { Badge } from "@/components/ui/badge";
import { SearchQuery } from "@/features/search";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

type FilterBadgesProps = {
  query: SearchQuery;
  collections?: { label: string; id: string }[];
  onDeleteHandler: (key: string, value?: string) => void;
};

function FilterBadges({
  query,
  collections,
  onDeleteHandler,
}: FilterBadgesProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!query.search && !query.priceRange && !collections) {
    return null;
  }

  return (
    <section className="flex flex-wrap gap-2">
      {query.search && (
        <Badge className="h-9 gap-x-2 bg-ink px-3.5 text-[13px] font-bold text-white">
          {`Búsqueda: ${query.search}`}
          <button
            onClick={() =>
              router.push(pathname + "?" + onDeleteHandler("search"))
            }
            aria-label="Quitar filtro"
            className={cn(
              "-mr-1 flex size-6 items-center justify-center rounded-full hover:bg-white/15",
            )}
          >
            <Icons.close className="size-3.5" aria-hidden />
          </button>
        </Badge>
      )}
      {query.priceRange && (
        <Badge className="h-9 gap-x-2 bg-ink px-3.5 text-[13px] font-bold text-white">
          {`Precio: ${query.priceRange[0]} – ${query.priceRange[1]} CUP`}
          <button
            onClick={() =>
              router.push(pathname + "?" + onDeleteHandler("price_range"))
            }
            aria-label="Quitar filtro"
            className={cn(
              "-mr-1 flex size-6 items-center justify-center rounded-full hover:bg-white/15",
            )}
          >
            <Icons.close className="size-3.5" aria-hidden />
          </button>
        </Badge>
      )}

      {collections &&
        collections.map((collection, index) =>
          query.collections.includes(collection.id) ? (
            <Badge
              key={index}
              className="h-9 gap-x-2 bg-ink px-3.5 text-[13px] font-bold text-white"
            >
              {`${collection.label}`}
              <button
                onClick={() => {
                  const deletedcollections = query.collections.filter(
                    (c) => c !== collection.id,
                  );
                  router.push(
                    pathname +
                      "?" +
                      onDeleteHandler(
                        "collections",
                        deletedcollections.length > 0
                          ? JSON.stringify(
                              query.collections.filter(
                                (c) => c !== collection.id,
                              ),
                            )
                          : undefined,
                      ),
                  );
                }}
                aria-label="Quitar filtro"
                className={cn(
                  "-mr-1 flex size-6 items-center justify-center rounded-full hover:bg-white/15",
                )}
              >
                <Icons.close className="size-3.5" aria-hidden />
              </button>
            </Badge>
          ) : null,
        )}
    </section>
  );
}

export default FilterBadges;
