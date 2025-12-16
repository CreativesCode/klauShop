import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface HeaderProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  heading: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  descriptionClassName?: string;
}

function Header({
  heading,
  description,
  children,
  className,
  descriptionClassName,
  ...props
}: HeaderProps) {
  return (
    <section className={cn("pt-[30px] pb-[30px]", className)} {...props}>
      <h1
        className={`text-2xl font-semibold text-center ${description ? "mb-8" : ""}`}
      >
        {heading}
      </h1>
      <p
        className={cn(
          "text-sm md:text-md leading-[1.5] tracking-[-2%] mb-2",
          descriptionClassName,
        )}
      >
        {description}
      </p>
      {children}
    </section>
  );
}

export default Header;
