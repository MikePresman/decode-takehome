"use client";

import { formatCompactCurrency, formatLabel } from "../../lib/analytics";


type RankedItem = {
  id: string;
  name: string;
  appointment_count: number;
  revenue_cents: number;
};


export function AnalyticsRankedList({
  title,
  subtitle,
  items,
  kind,
  onSelect
}: {
  title: string;
  subtitle: string;
  items: RankedItem[];
  kind: "service" | "provider";
  onSelect: (name: string) => void;
}) {
  const maxRevenue = items.reduce((max, item) => Math.max(max, item.revenue_cents), 0) || 1;

  return (
    <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">{title}</h2>
      <p className="text-[15px] text-[#9a7d67]">{subtitle}</p>

      <ol className="mt-8 space-y-6">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.name)}
              aria-label={`View patients for ${item.name}`}
              className="flex w-full items-center justify-between gap-4 rounded-2xl px-2 py-2 text-left transition-colors duration-200 hover:bg-[#faf6ef] focus:outline-none focus:ring-2 focus:ring-[#d8b17a]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 text-sm font-semibold text-[#d1b49c]">{index + 1}</span>
                <span className="truncate text-[1.05rem] font-medium text-[#2d2723]">
                  {kind === "provider" ? item.name : formatLabel(item.name)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[1.05rem] font-semibold text-[#2d2723]">
                  {formatCompactCurrency(item.revenue_cents)}
                </p>
                <p className="text-sm text-[#9a7d67]">
                  {item.appointment_count} appts
                </p>
              </div>
            </button>
            <div className="mt-3 h-2 rounded-full bg-[#efe4d7]">
              <div
                className="h-2 rounded-full bg-[#c78f46] transition-all duration-500"
                style={{ width: `${Math.max((item.revenue_cents / maxRevenue) * 100, 10)}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
