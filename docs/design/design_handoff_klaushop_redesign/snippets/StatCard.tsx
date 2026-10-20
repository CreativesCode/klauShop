// src/components/admin/StatCard.tsx (Server Component, sin dependencias)
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string; // ya formateado, p. ej. "186.400"
  unit?: string; // "CUP"
  deltaPct: number | null;
  previous?: string; // "165.836 CUP"
  series?: number[]; // para el sparkline (p. ej. overviewData.map(d => d.total))
};

function sparkPath(vals: number[]) {
  if (vals.length < 2) return { line: "", area: "" };
  const max = Math.max(...vals),
    min = Math.min(...vals),
    r = max - min || 1;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * 100,
    26 - ((v - min) / r) * 22,
  ]);
  const line =
    "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
  return { line, area: `${line} L100 28 L0 28 Z` };
}

export function StatCard({
  label,
  value,
  unit,
  deltaPct,
  previous,
  series = [],
}: Props) {
  const up = (deltaPct ?? 0) >= 0;
  const { line, area } = sparkPath(series);
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-[18px] border border-line bg-white p-[18px] pb-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-neutral-500">{label}</span>
        <span
          className={cn(
            "rounded-full px-2 py-[3px] text-xs font-extrabold",
            deltaPct === null
              ? "bg-surface-soft text-neutral-500"
              : up
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700",
          )}
        >
          {deltaPct === null
            ? "—"
            : `${up ? "↑" : "↓"} ${Math.abs(deltaPct).toFixed(1)}%`}
        </span>
      </div>
      <span className="whitespace-nowrap text-[clamp(22px,2vw,28px)] font-extrabold tracking-[-0.02em] tabular-nums">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-bold text-neutral-500">
            {unit}
          </span>
        )}
      </span>
      {line && (
        <svg
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="block h-[34px] w-full"
          aria-hidden
        >
          <path d={area} fill="rgba(109,40,217,.08)" />
          <path
            d={line}
            fill="none"
            stroke="#6D28D9"
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {previous && (
        <span className="text-xs text-neutral-500">
          vs. período anterior · {previous}
        </span>
      )}
    </div>
  );
}
