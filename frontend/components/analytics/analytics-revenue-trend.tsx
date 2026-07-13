"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatCompactCurrency, formatPeriodLabel, type AnalyticsSummaryResponse } from "../../lib/analytics";


type RevenueTrendPoint = AnalyticsSummaryResponse["revenue_trend"][number];

function RevenueTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RevenueTrendPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-2xl border border-[#eadccc] bg-white/95 px-4 py-3 shadow-[0_14px_30px_rgba(78,57,33,0.12)] backdrop-blur-sm">
      <p className="text-sm font-semibold text-[#2d2723]">{formatPeriodLabel(label ?? point.period)}</p>
      <p className="mt-1 text-sm text-[#7d6552]">{formatCompactCurrency(point.revenue_cents)} in paid revenue</p>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#ab8e76]">
        {point.appointment_count} appointments
      </p>
    </div>
  );
}


export function AnalyticsRevenueTrend({
  points,
  rangeKey
}: {
  points: AnalyticsSummaryResponse["revenue_trend"];
  rangeKey: string;
}) {
  const chartData = points.map((point) => ({
    ...point,
    label: formatPeriodLabel(point.period)
  }));

  return (
    <article className="flex h-full min-h-[420px] flex-col rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Revenue Trend</h2>
          <p className="text-[15px] text-[#9a7d67]">Paid revenue and appointment momentum across the selected range</p>
        </div>
      </div>

      <div className="mt-8 min-h-[280px] flex-1 overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf4_100%)] px-3 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={rangeKey}
            data={chartData}
            margin={{ top: 8, right: 16, left: -18, bottom: 8 }}
          >
            <defs>
              <linearGradient id="revenueAreaFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d8b17a" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#d8b17a" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f0e3d5" strokeDasharray="3 5" />
            <XAxis
              axisLine={false}
              dataKey="label"
              tickLine={false}
              tick={{ fill: "#a18672", fontSize: 13, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a18672", fontSize: 13, fontWeight: 500 }}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
              width={68}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#ead6ba", strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="revenue_cents"
              stroke="#c78f46"
              strokeWidth={4}
              fill="url(#revenueAreaFill)"
              dot={{ r: 0, fill: "#c78f46" }}
              activeDot={{ r: 6, fill: "#c78f46", stroke: "#fff7eb", strokeWidth: 3 }}
              isAnimationActive
              animationDuration={450}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
