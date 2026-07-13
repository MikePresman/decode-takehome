import { PatientEmptyState } from "@/components/patients/patient-empty-state";
import { PatientSummaryCards } from "@/components/patients/patient-summary-cards";
import { PatientTable } from "@/components/patients/patient-table";
import { PatientTableToolbar } from "@/components/patients/patient-table-toolbar";
import { applyPatientDrilldownFilters, getAllPatientsForDrilldown, getPatients, paginatePatients } from "@/lib/patients";
import { fetchJson } from "@/lib/api";


type SearchParams = {
  q?: string;
  source?: string;
  status?: string;
  gender?: string;
  has_payments?: string;
  service?: string;
  provider?: string;
  view?: string;
  sort?: string;
  order?: string;
  limit?: string;
  offset?: string;
};


function toBackendParams(searchParams: SearchParams) {
  const params = new URLSearchParams();
  const allowedKeys = new Set(["q", "source", "status", "gender", "has_payments", "sort", "order"]);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value && allowedKeys.has(key)) {
      params.set(key, value);
    }
  }

  return params;
}


export default async function PatientsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const hasDrilldownFilter =
    Boolean(searchParams.service) || Boolean(searchParams.provider);
  const backendParams = toBackendParams(searchParams);
  const queryParams = new URLSearchParams(backendParams.toString());
  queryParams.set("limit", searchParams.limit ?? "50");
  queryParams.set("offset", searchParams.offset ?? "0");
  const queryString = `?${queryParams.toString()}`;
  const [patients, metadata] = await Promise.all([
    hasDrilldownFilter ? getAllPatientsForDrilldown(backendParams) : getPatients(queryString),
    fetchJson<{ sources: string[]; service_count: number; provider_count: number }>("/api/metadata")
  ]);
  const filteredItems = applyPatientDrilldownFilters(patients.items, {
    service: searchParams.service,
    provider: searchParams.provider
  });
  const limit = Number(searchParams.limit ?? "50");
  const offset = Number(searchParams.offset ?? "0");
  const visibleItems = hasDrilldownFilter ? paginatePatients(filteredItems, limit, offset) : patients.items;
  const resultTotal = hasDrilldownFilter ? filteredItems.length : patients.total;

  const summaryItems = hasDrilldownFilter ? filteredItems : patients.items;
  const activeCount = summaryItems.filter((item) => item.status === "active").length;
  const newCount = summaryItems.filter((item) => item.status === "new").length;
  const averageLifetimeValueCents =
    summaryItems.length > 0
      ? Math.round(
          summaryItems.reduce((total, item) => total + item.lifetime_value_cents, 0) / summaryItems.length
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
        total={resultTotal}
        active={activeCount}
        newPatients={newCount}
        averageLifetimeValueCents={averageLifetimeValueCents}
      />

      <section className="overflow-hidden rounded-[32px] bg-white shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
        <PatientTableToolbar sources={metadata.sources} />
        {visibleItems.length === 0 ? (
          <div className="p-6">
            <PatientEmptyState />
          </div>
        ) : (
          <PatientTable
            items={visibleItems}
            total={resultTotal}
            limit={limit}
            offset={offset}
            currentSort={searchParams.sort ?? "created_date"}
            currentOrder={searchParams.order ?? "desc"}
            currentView={searchParams.view ?? "list"}
            currentQuery={new URLSearchParams(
              Object.entries(searchParams).filter(([, value]) => value).map(([key, value]) => [key, value as string])
            )}
          />
        )}
      </section>
    </div>
  );
}
