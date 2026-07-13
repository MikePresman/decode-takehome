import { formatCompactCurrency, formatPeriodLabel, type AnalyticsSummaryResponse } from "../../lib/analytics";


function trendPolyline(values: number[]) {
  if (values.length <= 1) {
    return "0,20 100,20";
  }

  const width = 100;
  const height = 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
}


export function AnalyticsRevenueTrend({
  points
}: {
  points: AnalyticsSummaryResponse["revenue_trend"];
}) {
  const values = points.map((point) => point.revenue_cents / 100);
  const polyline = trendPolyline(values);
  const highest = points.reduce((max, point) => Math.max(max, point.revenue_cents), 0);
  const mid = highest / 2;

  return (
    <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Revenue Trend</h2>
          <p className="text-[15px] text-[#9a7d67]">Monthly paid revenue and paid appointments</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-[60px_minmax(0,1fr)] gap-4">
          <div className="flex flex-col justify-between py-4 text-sm font-medium text-[#a18672]">
            <span>{formatCompactCurrency(highest)}</span>
            <span>{formatCompactCurrency(mid)}</span>
            <span>$0</span>
          </div>
          <div className="relative h-[260px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf4_100%)]">
            <div className="absolute inset-0">
              {[20, 40, 60, 80].map((top) => (
                <div
                  key={top}
                  className="absolute left-0 right-0 border-t border-dashed border-[#f0e3d5]"
                  style={{ top: `${top}%` }}
                />
              ))}
            </div>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-6 top-6 h-[180px] w-[calc(100%-3rem)]">
              <defs>
                <linearGradient id="revenueFillLive" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d8b17a" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#d8b17a" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon points={`0,40 ${polyline} 100,40`} fill="url(#revenueFillLive)" />
              <polyline points={polyline} fill="none" stroke="#c78f46" strokeWidth="0.7" />
              {polyline.split(" ").map((point) => {
                const [x, y] = point.split(",");
                return <circle key={point} cx={x} cy={y} r="1" fill="#c78f46" />;
              })}
            </svg>
            <div className="absolute inset-x-6 bottom-5 grid text-sm font-medium text-[#a18672]" style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}>
              {points.map((point) => (
                <span key={point.period}>{formatPeriodLabel(point.period)}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
