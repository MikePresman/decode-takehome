import { formatDate } from "../../lib/patients";
import { PatientStatusBadge } from "./patient-status-badge";


export function PatientDetailHeader({
  patient,
  status
}: {
  patient: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    source: string;
    created_date: string;
    gender: string;
    date_of_birth: string | null;
  };
  status: "active" | "inactive" | "new" | "never_paid";
}) {
  return (
    <section className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9f846e]">Patient Profile</p>
          <h1 className="mt-4 text-[2.25rem] font-semibold leading-none text-[#26211d]">
            {patient.full_name}
          </h1>
          <div className="mt-4 grid gap-2 text-[15px] text-[#5a4b3f] sm:grid-cols-2">
            <p>{patient.email}</p>
            <p>{patient.phone}</p>
            <p>{patient.address}</p>
            <p className="capitalize">{patient.source.replaceAll("_", " ")}</p>
            <p>Since {formatDate(patient.created_date)}</p>
            <p className="capitalize">{patient.gender}</p>
          </div>
        </div>
        <PatientStatusBadge status={status} />
      </div>
    </section>
  );
}
