import * as React from "react";

import { cn } from "@/lib/utils";

interface ShellProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  children: React.ReactNode;
  layout?: "default" | "dashboard" | "narrow";
}

export function Shell({
  children,
  layout = "default",
  className,
  ...props
}: ShellProps) {
  return (
    <section
      className={cn(
        // Store page container (same width and gutters as the header)
        "mx-auto flex w-full flex-col gap-6 px-4 pb-8 pt-4 md:gap-8 md:px-6 md:pt-8 xl:px-8",
        layout === "default" && "max-w-store",
        layout === "narrow" && "max-w-5xl",

        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
