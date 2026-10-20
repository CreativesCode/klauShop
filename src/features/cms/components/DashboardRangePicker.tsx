"use client";

import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import CalendarDateRangePicker from "./CalendarDateRangePicker";

type Preset = { label: string; from?: Date; to?: Date };

/** Dashboard period: presets as a segmented control + the custom calendar. */
export function DashboardRangePicker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const today = new Date();
  const day = (d: Date) => format(d, "yyyy-MM-dd");

  const presets: Preset[] = [
    { label: "Hoy", from: today, to: today },
    { label: "7 días", from: subDays(today, 6), to: today },
    // No params = this month until now (the page default)
    { label: "Este mes" },
    { label: "90 días", from: subDays(today, 89), to: today },
  ];

  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");
  const isActive = (p: Preset) =>
    p.from
      ? currentFrom === day(p.from) && currentTo === day(p.to!)
      : !currentFrom && !currentTo;
  const anyActive = presets.some(isActive);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-[#E7E4EF] bg-white p-[3px]">
        {presets.map((p) => (
          <Link
            key={p.label}
            href={
              p.from
                ? `${pathname}?from=${day(p.from)}&to=${day(p.to!)}`
                : pathname
            }
            replace
            scroll={false}
            aria-current={isActive(p) ? "true" : undefined}
            className={cn(
              "flex h-[34px] items-center whitespace-nowrap rounded-[9px] px-3 text-[13px] font-bold transition-colors",
              isActive(p)
                ? "bg-ink text-white"
                : "text-neutral-600 hover:text-ink",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <CalendarDateRangePicker active={!anyActive} />
    </div>
  );
}

export default DashboardRangePicker;
