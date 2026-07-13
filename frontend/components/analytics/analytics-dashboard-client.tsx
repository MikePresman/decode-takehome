"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { AnalyticsRankedList } from "./analytics-ranked-list";
import { AnalyticsRevenueTrend } from "./analytics-revenue-trend";
import { AnalyticsSourceBreakdown } from "./analytics-source-breakdown";
import { AnalyticsStatusMix } from "./analytics-status-mix";
import {
  ANALYTICS_RANGE_OPTIONS,
  buildAnalyticsSnapshot,
  buildPatientDrilldownHref,
  getManagementReadout,
  type AnalyticsRange,
  type AnalyticsSummaryResponse
} from "../../lib/analytics";


export function AnalyticsDashboardClient({
  summary
}: {
  summary: AnalyticsSummaryResponse;
}) {
  const router = useRouter();
  const [range, setRange] = useState<AnalyticsRange>("last_30_days");

  const snapshot = useMemo(() => buildAnalyticsSnapshot(summary, range), [summary, range]);
  const readout = useMemo(() => getManagementReadout(snapshot, range), [snapshot, range]);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[2.25rem] font-semibold leading-none text-[#26211d]">
            Analytics
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-[#9a7d67]">
            Operational and financial signals for patient acquisition, revenue performance, service demand, and provider utilization.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Date Range"
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsRange)}
            className="rounded-2xl border border-[#e6d9c8] bg-white px-5 py-3 text-sm font-semibold text-[#3f342b]"
          >
            {ANALYTICS_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <AnalyticsKpiCards overview={snapshot.overview} rangeKey={range} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <AnalyticsRevenueTrend points={snapshot.revenue_trend} rangeKey={range} />
        <AnalyticsSourceBreakdown
          items={snapshot.patient_sources}
          onSelect={(source) => router.push(buildPatientDrilldownHref("source", source))}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AnalyticsRankedList
          title="Top Services"
          subtitle="Services producing the most demand and paid revenue"
          items={snapshot.top_services.map((item) => ({
            id: item.service_id,
            name: item.name,
            appointment_count: item.appointment_count,
            revenue_cents: item.revenue_cents
          }))}
          kind="service"
          onSelect={(service) => router.push(buildPatientDrilldownHref("service", service))}
        />
        <AnalyticsRankedList
          title="Busiest Providers"
          subtitle="Providers with the highest appointment utilization"
          items={snapshot.busiest_providers.map((item) => ({
            id: item.provider_id,
            name: item.name,
            appointment_count: item.appointment_count,
            revenue_cents: item.revenue_cents
          }))}
          kind="provider"
          onSelect={(provider) => router.push(buildPatientDrilldownHref("provider", provider))}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <AnalyticsStatusMix items={snapshot.appointment_status_mix} />
        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)] transition-all duration-300">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            Management Readout
          </p>
          <div className="mt-6 space-y-5 text-[15px] leading-7 text-[#7f6755]">
            {readout.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
