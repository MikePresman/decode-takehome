import { AnalyticsKpiCards } from "../../components/analytics/analytics-kpi-cards";
import { AnalyticsRankedList } from "../../components/analytics/analytics-ranked-list";
import { AnalyticsRevenueTrend } from "../../components/analytics/analytics-revenue-trend";
import { AnalyticsSourceBreakdown } from "../../components/analytics/analytics-source-breakdown";
import { AnalyticsStatusMix } from "../../components/analytics/analytics-status-mix";
import { getAnalyticsSummary } from "../../lib/analytics";


export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSummary();

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
      </section>

      <AnalyticsKpiCards overview={analytics.overview} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <AnalyticsRevenueTrend points={analytics.revenue_trend} />
        <AnalyticsSourceBreakdown items={analytics.patient_sources} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AnalyticsRankedList
          title="Top Services"
          subtitle="Services producing the most demand and paid revenue"
          items={analytics.top_services.map((item) => ({
            id: item.service_id,
            name: item.name,
            appointment_count: item.appointment_count,
            revenue_cents: item.revenue_cents
          }))}
          kind="service"
        />
        <AnalyticsRankedList
          title="Busiest Providers"
          subtitle="Providers with the highest appointment utilization"
          items={analytics.busiest_providers.map((item) => ({
            id: item.provider_id,
            name: item.name,
            appointment_count: item.appointment_count,
            revenue_cents: item.revenue_cents
          }))}
          kind="provider"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <AnalyticsStatusMix items={analytics.appointment_status_mix} />
        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            Management Readout
          </p>
          <div className="mt-6 space-y-5 text-[15px] leading-7 text-[#7f6755]">
            <p>
              Patient acquisition is most useful when read alongside revenue contribution, not just patient count. This view surfaces whether demand is concentrated in a few channels or spread across the practice.
            </p>
            <p>
              Service and provider lists help management compare utilization and revenue concentration. If bookings are rising without revenue moving proportionally, the likely causes are lower-ticket service mix, payment issues, or status leakage.
            </p>
            <p>
              The appointment status mix is the operational warning system. A rising cancelled or no-show share should trigger workflow review around reminders, deposits, and rebooking.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
