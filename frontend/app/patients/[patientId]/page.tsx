import Link from "next/link";
import { notFound } from "next/navigation";

import { PatientDetailHeader } from "@/components/patients/patient-detail-header";
import { PatientDetailSections } from "@/components/patients/patient-detail-sections";
import { ApiError } from "@/lib/api";
import { getPatient } from "@/lib/patients";


export default async function PatientDetailPage({
  params
}: {
  params: { patientId: string };
}) {
  try {
    const detail = await getPatient(params.patientId);

    return (
      <div className="grid gap-6">
        <div>
          <Link href="/patients" className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            ← Back to Patients
          </Link>
        </div>
        <PatientDetailHeader patient={detail.patient} status={detail.summary.status} />
        <PatientDetailSections detail={detail} />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
