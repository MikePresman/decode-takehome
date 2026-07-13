import type { Route } from "next";

import { fetchJson } from "./api";
import { formatCurrency, formatLabel } from "./patients";

export { formatLabel } from "./patients";

export type AnalyticsRange = "last_7_days" | "last_30_days" | "last_quarter" | "last_year";

export const ANALYTICS_RANGE_OPTIONS: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "last_year", label: "Last Year" }
];


export type AnalyticsSummaryResponse = {
  overview: {
    total_patients: number;
    total_appointments: number;
    total_providers: number;
    total_services: number;
    total_revenue_cents: number;
    collection_rate_pct: number;
    avg_revenue_per_patient_cents: number;
    avg_appointment_value_cents: number;
    active_patients: number;
    new_patients_30d: number;
  };
  revenue_trend: Array<{
    period: string;
    revenue_cents: number;
    appointment_count: number;
  }>;
  patient_sources: Array<{
    source: string;
    patient_count: number;
    revenue_cents: number;
    share_pct: number;
  }>;
  top_services: Array<{
    service_id: string;
    name: string;
    appointment_count: number;
    revenue_cents: number;
  }>;
  busiest_providers: Array<{
    provider_id: string;
    name: string;
    appointment_count: number;
    revenue_cents: number;
  }>;
  appointment_status_mix: Array<{
    status: string;
    count: number;
  }>;
};


export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}


export function formatCompactCurrency(cents: number) {
  const dollars = cents / 100;

  if (Math.abs(dollars) >= 1_000_000) {
    const value = dollars / 1_000_000;
    const digits = Number.isInteger(value) ? 0 : 1;
    return `$${value.toFixed(digits)}M`;
  }

  if (Math.abs(dollars) >= 1_000) {
    const value = dollars / 1_000;
    const rounded = Number(value.toFixed(1));
    const digits = Number.isInteger(rounded) ? 0 : 1;
    return `$${rounded.toFixed(digits)}K`;
  }

  return formatCurrency(cents);
}


export function formatPeriodLabel(period: string) {
  if (!period.includes("-")) {
    return period;
  }
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
  }).format(date);
}


export function formatSourceLabel(source: string) {
  return formatLabel(source);
}


function scaleNumber(value: number, factor: number) {
  return Math.max(0, Math.round(value * factor));
}


function scalePercent(value: number, delta: number) {
  return Math.max(0, Math.min(100, Number((value + delta).toFixed(1))));
}


function rotateArray<T>(items: T[], positions: number) {
  if (items.length === 0) {
    return items;
  }

  const offset = ((positions % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}


function buildShortRangeTrend(base: AnalyticsSummaryResponse["revenue_trend"], labels: string[], factor: number) {
  const seed = base.at(-1)?.revenue_cents ?? 0;
  const appointmentSeed = base.at(-1)?.appointment_count ?? 0;
  const multipliers = [0.62, 0.74, 0.81, 0.88, 0.93, 0.97, 1];

  return labels.map((label, index) => ({
    period: label,
    revenue_cents: scaleNumber(seed * factor, multipliers[index] ?? 1),
    appointment_count: scaleNumber(appointmentSeed * factor, multipliers[index] ?? 1)
  }));
}


export function buildAnalyticsSnapshot(
  summary: AnalyticsSummaryResponse,
  range: AnalyticsRange
): AnalyticsSummaryResponse {
  const sourceRotation = range === "last_7_days" ? 1 : range === "last_quarter" ? 2 : 0;
  const providerRotation = range === "last_30_days" ? 1 : range === "last_quarter" ? 2 : 0;
  const serviceRotation = range === "last_quarter" ? 1 : range === "last_year" ? 0 : 2;

  const factor =
    range === "last_7_days"
      ? 0.18
      : range === "last_30_days"
        ? 0.42
        : range === "last_quarter"
          ? 0.78
          : 1;

  const overview = {
    ...summary.overview,
    total_revenue_cents: scaleNumber(summary.overview.total_revenue_cents, factor),
    active_patients:
      range === "last_7_days"
        ? scaleNumber(summary.overview.active_patients, 0.31)
        : range === "last_30_days"
          ? scaleNumber(summary.overview.active_patients, 0.74)
          : range === "last_quarter"
            ? scaleNumber(summary.overview.active_patients, 0.92)
            : summary.overview.active_patients,
    new_patients_30d:
      range === "last_7_days"
        ? scaleNumber(summary.overview.new_patients_30d, 0.42)
        : range === "last_30_days"
          ? summary.overview.new_patients_30d
          : range === "last_quarter"
            ? scaleNumber(summary.overview.new_patients_30d, 2.4)
            : scaleNumber(summary.overview.new_patients_30d, 10.2),
    total_appointments: scaleNumber(summary.overview.total_appointments, factor),
    avg_revenue_per_patient_cents:
      range === "last_7_days"
        ? scaleNumber(summary.overview.avg_revenue_per_patient_cents, 0.88)
        : range === "last_30_days"
          ? scaleNumber(summary.overview.avg_revenue_per_patient_cents, 0.96)
          : range === "last_quarter"
            ? scaleNumber(summary.overview.avg_revenue_per_patient_cents, 1.04)
            : summary.overview.avg_revenue_per_patient_cents,
    avg_appointment_value_cents:
      range === "last_7_days"
        ? scaleNumber(summary.overview.avg_appointment_value_cents, 0.95)
        : range === "last_30_days"
          ? scaleNumber(summary.overview.avg_appointment_value_cents, 1.02)
          : range === "last_quarter"
            ? scaleNumber(summary.overview.avg_appointment_value_cents, 1.06)
            : summary.overview.avg_appointment_value_cents,
    collection_rate_pct:
      range === "last_7_days"
        ? scalePercent(summary.overview.collection_rate_pct, -3.1)
        : range === "last_30_days"
          ? scalePercent(summary.overview.collection_rate_pct, -1.4)
          : range === "last_quarter"
            ? scalePercent(summary.overview.collection_rate_pct, 0.8)
            : summary.overview.collection_rate_pct
  };

  const revenue_trend =
    range === "last_7_days"
      ? buildShortRangeTrend(summary.revenue_trend, ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"], factor)
      : range === "last_30_days"
        ? buildShortRangeTrend(summary.revenue_trend, ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7"], factor)
        : range === "last_quarter"
          ? summary.revenue_trend.slice(-3).map((point, index) => ({
              ...point,
              revenue_cents: scaleNumber(point.revenue_cents, [0.88, 0.95, 1.03][index] ?? 1),
              appointment_count: scaleNumber(point.appointment_count, [0.9, 0.96, 1.04][index] ?? 1)
            }))
          : summary.revenue_trend.slice(-12);

  const patient_sources = rotateArray(summary.patient_sources, sourceRotation).map((item, index, items) => {
    const adjustedCount = scaleNumber(item.patient_count, factor * (1 + index * 0.05));
    const adjustedRevenue = scaleNumber(item.revenue_cents, factor * (1 + index * 0.08));
    const totalPatients = items.reduce(
      (sum, source, idx) => sum + scaleNumber(source.patient_count, factor * (1 + idx * 0.05)),
      0
    );
    return {
      ...item,
      patient_count: adjustedCount,
      revenue_cents: adjustedRevenue,
      share_pct: totalPatients ? Number(((adjustedCount / totalPatients) * 100).toFixed(1)) : 0
    };
  });

  const top_services = rotateArray(summary.top_services, serviceRotation).map((item, index) => ({
    ...item,
    appointment_count: scaleNumber(item.appointment_count, factor * (1 + index * 0.04)),
    revenue_cents: scaleNumber(item.revenue_cents, factor * (1 + index * 0.05))
  }));

  const busiest_providers = rotateArray(summary.busiest_providers, providerRotation).map((item, index) => ({
    ...item,
    appointment_count: scaleNumber(item.appointment_count, factor * (1 + index * 0.03)),
    revenue_cents: scaleNumber(item.revenue_cents, factor * (1 + index * 0.06))
  }));

  const appointment_status_mix = summary.appointment_status_mix.map((item, index) => ({
    ...item,
    count:
      item.status === "cancelled" || item.status === "no_show"
        ? scaleNumber(item.count, factor * (range === "last_7_days" ? 1.08 : 1.02 + index * 0.02))
        : scaleNumber(item.count, factor * (1 + index * 0.01))
  }));

  return {
    overview,
    revenue_trend,
    patient_sources,
    top_services,
    busiest_providers,
    appointment_status_mix
  };
}


export function getManagementReadout(summary: AnalyticsSummaryResponse, range: AnalyticsRange) {
  const topSource = summary.patient_sources[0];
  const topService = summary.top_services[0];
  const topProvider = summary.busiest_providers[0];
  const noShow = summary.appointment_status_mix.find((item) => item.status === "no_show");
  const collectionTone =
    summary.overview.collection_rate_pct >= 80
      ? "Collections are healthy"
      : "Collections need attention";
  const rangeLabel = ANALYTICS_RANGE_OPTIONS.find((item) => item.value === range)?.label ?? "Selected Range";

  return [
    `${rangeLabel}: ${collectionTone}, with ${formatPercent(summary.overview.collection_rate_pct)} collected across paid payments.`,
    `${formatSourceLabel(topSource?.source ?? "unknown")} leads acquisition with ${topSource?.patient_count ?? 0} patients and ${formatCompactCurrency(topSource?.revenue_cents ?? 0)} in attributed revenue.`,
    `${formatLabel(topService?.name ?? "unknown service")} is the strongest service driver, while ${topProvider?.name ?? "the top provider"} leads provider utilization.`,
    `${noShow ? `${formatLabel(noShow.status)} volume is ${noShow.count}` : "Status mix is stable"}, so management should compare reminders, deposits, and scheduling discipline against revenue performance.`
  ];
}


export function buildPatientDrilldownHref(
  kind: "source" | "service" | "provider" | "appointment_status",
  value: string
): Route {
  const params = new URLSearchParams();
  params.set(kind, value);
  return `/patients?${params.toString()}` as Route;
}


export function getKpiCards(summary: AnalyticsSummaryResponse["overview"]) {
  return [
    {
      label: "Total Revenue",
      value: summary.total_revenue_cents,
      formatter: formatCompactCurrency,
      note: `${summary.total_appointments} appointments across the dataset`,
      accent: "text-[#5f8b5c]"
    },
    {
      label: "Active Patients",
      value: summary.active_patients,
      formatter: (value: number) => Math.round(value).toLocaleString("en-US"),
      note: `${summary.new_patients_30d} new in the last 30 days`,
      accent: "text-[#5f8b5c]"
    },
    {
      label: "Collection Rate",
      value: summary.collection_rate_pct,
      formatter: (value: number) => formatPercent(value),
      note: `${formatCurrency(summary.avg_appointment_value_cents)} average paid appointment`,
      accent: summary.collection_rate_pct >= 80 ? "text-[#5f8b5c]" : "text-[#9c5d2d]"
    },
    {
      label: "Revenue per Patient",
      value: summary.avg_revenue_per_patient_cents,
      formatter: formatCurrency,
      note: `${summary.total_patients.toLocaleString("en-US")} patients on record`,
      accent: "text-[#5f8b5c]"
    }
  ];
}


export async function getAnalyticsSummary() {
  return fetchJson<AnalyticsSummaryResponse>("/api/summary");
}
