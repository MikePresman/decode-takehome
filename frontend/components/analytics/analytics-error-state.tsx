"use client";

import { PatientErrorState } from "../patients/patient-error-state";


export function AnalyticsErrorState({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <PatientErrorState
      title="The analytics dashboard is temporarily unavailable"
      message={error.message || "There was a problem loading business analytics."}
      onRetry={reset}
    />
  );
}
