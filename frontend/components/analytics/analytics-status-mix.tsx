"use client";

import { formatLabel, type AnalyticsSummaryResponse } from "../../lib/analytics";


export function AnalyticsStatusMix({
  items
}: {
  items: AnalyticsSummaryResponse["appointment_status_mix"];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Appointment Status Mix</h2>
      <p className="text-[15px] text-[#9a7d67]">Operational signal for completed, cancelled, and no-show volume</p>

      <ul className="mt-8 space-y-5">
        {items.map((item) => {
          const width = (item.count / total) * 100;
          return (
            <li key={item.status}>
              <div className="w-full rounded-2xl px-2 py-2 text-left">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[1.02rem] font-medium text-[#2d2723]">{formatLabel(item.status)}</span>
                  <span className="text-sm font-semibold text-[#9a7d67]">
                    {item.count} · {width.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#efe4d7]">
                  <div className="h-2 rounded-full bg-[#6d9da0] transition-all duration-500" style={{ width: `${Math.max(width, 6)}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
