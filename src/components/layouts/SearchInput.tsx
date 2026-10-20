"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/input";
import { Icons } from "./icons";

const filterSelectionSchema = z.object({
  search: z.string(),
});

type Props = {
  /** desktop: pill in the header row; mobile: full-width second header row */
  variant?: "desktop" | "mobile";
  className?: string;
};

function SearchInput({ variant = "desktop", className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof filterSelectionSchema>>({
    resolver: zodResolver(filterSelectionSchema),
    defaultValues: { search: searchParams.get("search") || "" },
  });

  function onSubmit({ search }: z.infer<typeof filterSelectionSchema>) {
    !search || search.length === 0
      ? router.push(`/shop`)
      : router.push(`/shop/?search=${encodeURIComponent(search)}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        role="search"
        className={cn(
          "flex h-11 w-full items-center gap-2.5 border border-transparent bg-surface-muted px-4 transition-colors focus-within:border-primary-300 focus-within:bg-white",
          variant === "desktop" ? "max-w-[560px] rounded-full" : "rounded-xl",
          className,
        )}
      >
        <Icons.search
          className="size-[18px] shrink-0 text-neutral-500"
          aria-hidden
        />
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem className="flex-1 space-y-0">
              <FormControl>
                <Input
                  {...field}
                  type="search"
                  enterKeyHint="search"
                  aria-label="Buscar productos"
                  variant="ghost"
                  placeholder={
                    variant === "desktop"
                      ? "Buscar vestidos, juguetes, accesorios…"
                      : "Buscar en Klau's Shop"
                  }
                  className="h-10 rounded-none px-0 placeholder:text-neutral-500 [&::-webkit-search-cancel-button]:hidden"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export default SearchInput;
