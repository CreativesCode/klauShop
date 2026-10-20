import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface HeaderProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  heading: string;
  description?: string;
  /** Right side of the heading row: "Ver todo →" link or a segmented control */
  action?: ReactNode;
  /** Page titles use h1; sections default to h2 */
  as?: "h1" | "h2";
  children?: ReactNode;
  className?: string;
  descriptionClassName?: string;
}

/** Store section heading: title + optional description, action on the right. */
function Header({
  heading,
  description,
  action,
  as: Heading = "h2",
  children,
  className,
  descriptionClassName,
  ...props
}: HeaderProps) {
  return (
    <section className={cn("pt-8 md:pt-12", className)} {...props}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Heading className="text-[clamp(22px,2.2vw,30px)] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
            {heading}
          </Heading>
          {description && (
            <p
              className={cn(
                "mt-1.5 text-[15px] text-neutral-500",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default Header;
