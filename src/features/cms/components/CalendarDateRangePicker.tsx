"use client";

import { format, isValid, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { DateRange } from "react-day-picker";

import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function CalendarDateRangePicker({
  className,
  active = false,
}: React.HTMLAttributes<HTMLDivElement> & {
  /** A custom range (not a preset) is selected */
  active?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const parsedFrom = fromParam ? parseISO(fromParam) : null;
  const parsedTo = toParam ? parseISO(toParam) : null;

  const initialFrom = parsedFrom && isValid(parsedFrom) ? parsedFrom : null;
  const initialTo = parsedTo && isValid(parsedTo) ? parsedTo : null;

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: initialFrom ?? startOfMonth(new Date()),
    to: initialTo ?? new Date(),
  });

  // Si el usuario navega/cambia query params, sincroniza el estado local
  React.useEffect(() => {
    const nextFrom = initialFrom ?? startOfMonth(new Date());
    const nextTo = initialTo ?? new Date();
    setDate({ from: nextFrom, to: nextTo });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromParam, toParam]);

  const onSelect = React.useCallback(
    (next: DateRange | undefined) => {
      setDate(next);

      const params = new URLSearchParams(searchParams.toString());

      if (next?.from) {
        params.set("from", format(next.from, "yyyy-MM-dd"));
      } else {
        params.delete("from");
      }

      if (next?.to) {
        params.set("to", format(next.to, "yyyy-MM-dd"));
      } else {
        params.delete("to");
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={active ? "dark" : "outline"}
            className={cn(
              "h-10 justify-start border-[#E7E4EF] text-left",
              active && "border-ink",
            )}
          >
            <Icons.calendar className="size-4" aria-hidden />
            {active && date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "d MMM", { locale: es })} –{" "}
                  {format(date.to, "d MMM", { locale: es })}
                </>
              ) : (
                format(date.from, "d MMM", { locale: es })
              )
            ) : (
              <span>Personalizado</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CalendarDateRangePicker;
