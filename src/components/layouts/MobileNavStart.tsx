"use client";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { Icons } from "./icons";

/** Left slot of the mobile header: back button on product pages, menu elsewhere. */
function MobileNavStart({ menu }: { menu: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (!/^\/shop\/[^/]+$/.test(pathname)) return <>{menu}</>;

  return (
    <button
      type="button"
      aria-label="Volver"
      onClick={() =>
        // Opened from a shared link there is no in-app history to go back to
        window.history.length > 1 ? router.back() : router.push("/shop")
      }
      className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-muted"
    >
      <Icons.chevronLeft className="size-6" aria-hidden />
    </button>
  );
}

export default MobileNavStart;
