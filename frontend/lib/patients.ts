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


export async function getPatients(queryString = "") {
  return fetchJson<PatientsResponse>(`/api/patients${queryString}`);
}


export async function getPatient(patientId: string) {
  return fetchJson<PatientDetailResponse>(`/api/patients/${patientId}`);
}
