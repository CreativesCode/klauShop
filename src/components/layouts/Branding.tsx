import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// imagotipo_horizontal_tight.svg is 376×176 (viewBox cropped to the artwork)
const RATIO = 376 / 176;

type Props = { className?: string; height?: number };

function Branding({ className, height = 40 }: Props) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — inicio`}
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/imagotipo_horizontal_tight.svg"
        alt={siteConfig.name}
        width={Math.round(height * RATIO)}
        height={height}
        priority
      />
    </Link>
  );
}

export default Branding;
