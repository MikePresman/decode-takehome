"use client";

import { AnalyticsErrorState } from "../../components/analytics/analytics-error-state";


export default function AnalyticsError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return <AnalyticsErrorState error={error} reset={reset} />;
}
