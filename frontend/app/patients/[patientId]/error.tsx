"use client";

import { PatientErrorState } from "@/components/patients/patient-error-state";


export default function PatientDetailError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PatientErrorState
      title="The patient profile could not be loaded"
      message={error.message || "There was a problem loading this patient profile."}
      onRetry={reset}
      backHref="/patients"
      backLabel="Back to Patients"
    />
  );
}
