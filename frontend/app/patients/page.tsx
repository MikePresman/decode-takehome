import { PatientEmptyState } from "@/components/patients/patient-empty-state";
import { PatientSummaryCards } from "@/components/patients/patient-summary-cards";
import { PatientTable } from "@/components/patients/patient-table";
import { PatientTableToolbar } from "@/components/patients/patient-table-toolbar";
import { getPatients } from "@/lib/patients";
import { fetchJson } from "@/lib/api";


type SearchParams = {
  q?: string;
  source?: string;
  status?: string;
  gender?: string;
  has_payments?: string;
  view?: string;
  sort?: string;
  order?: string;
  limit?: string;
  offset?: string;
};


function toQueryString(searchParams: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}


export default async function PatientsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const queryString = toQueryString(searchParams);
  const [patients, metadata] = await Promise.all([
    getPatients(queryString),
    fetchJson<{ sources: string[]; service_count: number; provider_count: number }>("/api/metadata")
  ]);

  const activeCount = patients.items.filter((item) => item.status === "active").length;
  const newCount = patients.items.filter((item) => item.status === "new").length;
  const averageLifetimeValueCents =
    patients.items.length > 0
      ? Math.round(
          patients.items.reduce((total, item) => total + item.lifetime_value_cents, 0) / patients.items.length
        )
      : 0;

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[2.25rem] font-semibold leading-none text-[#26211d]">
            Patients
          </h1>
          <p className="mt-3 text-lg text-[#9a7d67]">
            Search, filter, and review your patient roster with operational context.
          </p>
        </div>
      </section>

      <PatientSummaryCards
        total={patients.total}
        active={activeCount}
        newPatients={newCount}
        averageLifetimeValueCents={averageLifetimeValueCents}
      />

      <section className="overflow-hidden rounded-[32px] bg-white shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
        <PatientTableToolbar sources={metadata.sources} />
        {patients.items.length === 0 ? (
          <div className="p-6">
            <PatientEmptyState />
          </div>
        ) : (
          <PatientTable
            items={patients.items}
            total={patients.total}
            limit={patients.limit}
            offset={patients.offset}
            currentSort={searchParams.sort ?? "created_date"}
            currentOrder={searchParams.order ?? "desc"}
            currentView={searchParams.view ?? "list"}
            currentQuery={new URLSearchParams(queryString)}
          />
        )}
      </section>
    </div>
  );
}
