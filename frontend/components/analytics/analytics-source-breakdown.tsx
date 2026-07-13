import { formatCompactCurrency, formatSourceLabel, type AnalyticsSummaryResponse } from "../../lib/analytics";


const palette = ["#c78f46", "#6d9da0", "#7fa17b", "#cf7e73", "#8c79c7", "#c9a35a"];

export function AnalyticsSourceBreakdown({
  items
}: {
  items: AnalyticsSummaryResponse["patient_sources"];
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
        <div
          className="h-44 w-44 rounded-full"
          style={{
            background: gradientStops ? `conic-gradient(${gradientStops})` : "#efe4d7"
          }}
        >
          <div className="m-auto mt-7 flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9f846e]">Patients</span>
            <span className="mt-2 text-2xl font-semibold text-[#2d2723]">
              {totalPatients.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {items.map((item, index) => (
          <li key={item.source} className="flex items-start justify-between gap-3 text-[15px]">
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
          </li>
        ))}
      </ul>
    </article>
  );
}
