"use client";

import { formatCompactCurrency, formatSourceLabel, type AnalyticsSummaryResponse } from "../../lib/analytics";


const palette = ["#c78f46", "#6d9da0", "#7fa17b", "#cf7e73", "#8c79c7", "#c9a35a"];

export function AnalyticsSourceBreakdown({
  items,
  onSelect
}: {
  items: AnalyticsSummaryResponse["patient_sources"];
  onSelect: (source: string) => void;
}) {
  const totalPatients = items.reduce((total, item) => total + item.patient_count, 0);
  const gradientStops = items
    .reduce<{ color: string; from: number; to: number }[]>((stops, item, index) => {
      const start = index === 0 ? 0 : stops[stops.length - 1].to;
      const end = start + item.share_pct;
      stops.push({ color: palette[index % palette.length], from: start, to: end });
      return stops;
    }, [])
    .map((stop) => `${stop.color} ${stop.from}% ${stop.to}%`)
    .join(", ");

  return (
    <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Patient Sources</h2>
      <p className="text-[15px] text-[#9a7d67]">Where patients originate and what they contribute</p>

      <div className="mt-6 flex justify-center">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 120 120" className="h-44 w-44 -rotate-90">
            {items.reduce<{ start: number; nodes: React.ReactNode[] }>(
              (state, item, index) => {
                const length = (item.share_pct / 100) * 314;
                state.nodes.push(
                  <circle
                    key={item.source}
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke={palette[index % palette.length]}
                    strokeWidth="18"
                    strokeDasharray={`${length} 314`}
                    strokeDashoffset={-state.start}
                    className="cursor-pointer transition-opacity duration-200 hover:opacity-80 focus:opacity-80"
                    tabIndex={0}
                    role="button"
                    aria-label={`Filter patients by source ${formatSourceLabel(item.source)}`}
                    onClick={() => onSelect(item.source)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(item.source);
                      }
                    }}
                  />
                );
                return { start: state.start + length, nodes: state.nodes };
              },
              { start: 0, nodes: [] }
            ).nodes}
          </svg>
          <div className="pointer-events-none absolute inset-0 m-auto flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9f846e]">Patients</span>
            <span className="mt-2 text-2xl font-semibold text-[#2d2723]">
              {totalPatients.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {items.map((item, index) => (
          <li key={item.source}>
            <button
              type="button"
              onClick={() => onSelect(item.source)}
              aria-label={`View patients from ${formatSourceLabel(item.source)}`}
              className="flex w-full items-start justify-between gap-3 rounded-2xl px-2 py-2 text-left text-[15px] transition-colors duration-200 hover:bg-[#faf6ef] focus:outline-none focus:ring-2 focus:ring-[#d8b17a]"
            >
              <div className="min-w-0">
                <span className="flex items-center gap-3 text-[#5f5145]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  {formatSourceLabel(item.source)}
                </span>
                <p className="mt-1 text-sm text-[#9a7d67]">
                  {item.patient_count.toLocaleString("en-US")} patients · {item.share_pct.toFixed(1)}%
                </p>
              </div>
              <span className="font-semibold text-[#2d2723]">{formatCompactCurrency(item.revenue_cents)}</span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
