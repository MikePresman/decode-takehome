import { AnalyticsDashboardClient } from "../../components/analytics/analytics-dashboard-client";
import { getAnalyticsSummary } from "../../lib/analytics";


export default async function AnalyticsPage() {
  const analytics = await getAnalyticsSummary();

  return (
    <AnalyticsDashboardClient summary={analytics} />
  );
}
