import { fetchJson } from "@/lib/api";


export type PatientStatus = "active" | "inactive" | "new" | "never_paid";

export type PatientListItem = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  source: string;
  gender: string;
  created_date: string;
  appointment_count: number;
  paid_appointment_count: number;
  lifetime_value_cents: number;
  last_appointment_date: string | null;
  last_paid_date: string | null;
  days_since_last_appointment: number | null;
  preferred_provider_name: string | null;
  top_service_name: string | null;
  status: PatientStatus;
};

export type PatientDrilldownFilters = {
  service?: string;
  provider?: string;
};

export type PatientsResponse = {
  total: number;
  limit: number;
  offset: number;
  items: PatientListItem[];
};

export type PatientDetailResponse = {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: string | null;
    gender: string;
    source: string;
    created_date: string;
  };
  summary: {
    appointment_count: number;
    completed_appointment_count: number;
    cancelled_appointment_count: number;
    no_show_appointment_count: number;
    paid_appointment_count: number;
    unpaid_appointment_count: number;
    lifetime_value_cents: number;
    last_appointment_date: string | null;
    last_paid_date: string | null;
    days_since_last_appointment: number | null;
    days_since_last_payment: number | null;
    last_payment_method: string | null;
    preferred_provider_name: string | null;
    top_service_name: string | null;
    status: PatientStatus;
  };
  top_services: Array<{ service_id: string; name: string; count: number }>;
  top_providers: Array<{ provider_id: string; name: string; count: number }>;
  recent_payments: Array<{
    id: string;
    amount: number;
    date: string;
    method: string;
    status: string;
    service_id: string;
    service_name: string | null;
    provider_id: string;
    provider_name: string | null;
  }>;
  recent_appointments: Array<{
    id: string;
    created_date: string;
    status: string;
    service_names: string[];
    provider_names: string[];
  }>;
};

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}


export function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}


export function formatRelativeDays(days: number | null) {
  if (days === null) {
    return "No visits yet";
  }
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "1 day ago";
  }
  return `${days} days ago`;
}


export function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


function normalizeFilterValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}


export function applyPatientDrilldownFilters(
  items: PatientListItem[],
  filters: PatientDrilldownFilters
) {
  const service = normalizeFilterValue(filters.service);
  const provider = normalizeFilterValue(filters.provider);

  return items.filter((item) => {
    if (service && normalizeFilterValue(item.top_service_name) !== service) {
      return false;
    }

    if (provider && normalizeFilterValue(item.preferred_provider_name) !== provider) {
      return false;
    }

    return true;
  });
}


export function paginatePatients(items: PatientListItem[], limit: number, offset: number) {
  return items.slice(offset, offset + limit);
}


export async function getPatients(queryString = "") {
  return fetchJson<PatientsResponse>(`/api/patients${queryString}`);
}


export async function getAllPatientsForDrilldown(baseParams: URLSearchParams) {
  const firstParams = new URLSearchParams(baseParams.toString());
  firstParams.set("limit", "250");
  firstParams.set("offset", "0");

  const firstPage = await getPatients(`?${firstParams.toString()}`);
  const items = [...firstPage.items];

  for (let offset = firstPage.limit; offset < firstPage.total; offset += firstPage.limit) {
    const nextParams = new URLSearchParams(baseParams.toString());
    nextParams.set("limit", String(firstPage.limit));
    nextParams.set("offset", String(offset));
    const page = await getPatients(`?${nextParams.toString()}`);
    items.push(...page.items);
  }

  return {
    total: items.length,
    limit: firstPage.limit,
    offset: 0,
    items
  };
}


export async function getPatient(patientId: string) {
  return fetchJson<PatientDetailResponse>(`/api/patients/${patientId}`);
}
