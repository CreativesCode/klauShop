"use client";

import { formatCUP } from "@/lib/utils";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export type OverviewDatum = {
  name: string;
  total: number;
};

type OverviewProps = {
  data: OverviewDatum[];
  title?: string;
  /** "Este mes · 186.400 CUP en total" */
  subtitle?: string;
  /** Label of the best bucket ("Mejor día" / "Mejor mes") */
  bestLabel?: string;
};

const kTick = (value: number) =>
  value >= 1000 ? `${Math.round(value / 100) / 10}k` : `${value}`;

/** Paid revenue bars: the best bucket is highlighted, hover shows its amount. */
export function Overview({
  data,
  title = "Ingresos pagados",
  subtitle,
  bestLabel = "Mejor día",
}: OverviewProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const bestIndex = data.reduce(
    (best, d, i) => (d.total > (data[best]?.total ?? -1) ? i : best),
    0,
  );
  const shown = hovered ?? bestIndex;
  const readout = data[shown];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-extrabold text-ink">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-neutral-500">{subtitle}</p>
          )}
        </div>
        {readout && readout.total > 0 && (
          <p className="text-[13px] font-semibold text-neutral-500">
            {hovered === null ? bestLabel : readout.name} ·{" "}
            <span className="font-extrabold tabular-nums text-ink">
              {formatCUP(readout.total)}
            </span>
          </p>
        )}
      </div>
      <div className="h-[clamp(180px,22vw,260px)] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 0, left: -12, bottom: 0 }}
            onMouseMove={(state) =>
              setHovered(
                typeof state?.activeTooltipIndex === "number"
                  ? state.activeTooltipIndex
                  : null,
              )
            }
            onMouseLeave={() => setHovered(null)}
          >
            <CartesianGrid
              vertical={false}
              stroke="#ECEAF3"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={kTick}
              width={44}
            />
            <Bar dataKey="total" radius={[5, 5, 2, 2]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i === hovered
                      ? "#6D28D9"
                      : i === bestIndex
                        ? "#7C3AED"
                        : "#DDD6FE"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Overview;
