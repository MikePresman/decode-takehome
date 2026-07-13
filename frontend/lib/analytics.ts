import { fetchJson } from "./api";
import { formatCurrency, formatLabel } from "./patients";

export { formatLabel } from "./patients";


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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(dollars);
}


export function formatPeriodLabel(period: string) {
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


export function getKpiCards(summary: AnalyticsSummaryResponse["overview"]) {
  return [
    {
      label: "Total Revenue",
      value: formatCompactCurrency(summary.total_revenue_cents),
      note: `${summary.total_appointments} appointments across the dataset`,
      accent: "text-[#5f8b5c]"
    },
    {
      label: "Active Patients",
      value: summary.active_patients.toLocaleString("en-US"),
      note: `${summary.new_patients_30d} new in the last 30 days`,
      accent: "text-[#5f8b5c]"
    },
    {
      label: "Collection Rate",
      value: formatPercent(summary.collection_rate_pct),
      note: `${formatCurrency(summary.avg_appointment_value_cents)} average paid appointment`,
      accent: summary.collection_rate_pct >= 80 ? "text-[#5f8b5c]" : "text-[#9c5d2d]"
    },
    {
      label: "Revenue per Patient",
      value: formatCurrency(summary.avg_revenue_per_patient_cents),
      note: `${summary.total_patients.toLocaleString("en-US")} patients on record`,
      accent: "text-[#5f8b5c]"
    }
  ];
}


export async function getAnalyticsSummary() {
  return fetchJson<AnalyticsSummaryResponse>("/api/summary");
}
