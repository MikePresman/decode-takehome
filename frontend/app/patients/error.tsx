"use client";

import { PatientErrorState } from "@/components/patients/patient-error-state";


export default function PatientsError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PatientErrorState
      title="The patient roster is temporarily unavailable"
      message={error.message || "There was a problem loading patients. Retry the request or refresh the page."}
      onRetry={reset}
    />
  );
}
