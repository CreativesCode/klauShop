"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface SettingSidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SettingSidebarNav({
  className,
  items,
  ...props
}: SettingSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          className={cn(
            "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-bold transition-colors lg:h-11 lg:rounded-xl lg:border-transparent",
            pathname === item.href
              ? "border-ink bg-ink text-white lg:bg-primary-50 lg:text-primary-700"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-ink lg:bg-transparent lg:hover:border-transparent lg:hover:bg-surface-hover",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
