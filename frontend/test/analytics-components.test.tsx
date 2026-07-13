import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock })
}));

import { AnalyticsDashboardClient } from "../components/analytics/analytics-dashboard-client";
import { AnalyticsKpiCards } from "../components/analytics/analytics-kpi-cards";
import { AnalyticsRankedList } from "../components/analytics/analytics-ranked-list";
import { AnalyticsSourceBreakdown } from "../components/analytics/analytics-source-breakdown";
import { AnalyticsStatusMix } from "../components/analytics/analytics-status-mix";


describe("Analytics components", () => {
  it("renders KPI cards from overview data", () => {
    render(
      <AnalyticsKpiCards
        overview={{
          total_patients: 4000,
          total_appointments: 8200,
          total_providers: 12,
          total_services: 18,
          total_revenue_cents: 12500000,
          collection_rate_pct: 82.4,
          avg_revenue_per_patient_cents: 3125,
          avg_appointment_value_cents: 18400,
          active_patients: 1274,
          new_patients_30d: 48
        }}
        rangeKey="last_30_days"
      />
    );

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$125K")).toBeInTheDocument();
    expect(screen.getByText("1,274")).toBeInTheDocument();
    expect(screen.getByText("82.4%")).toBeInTheDocument();
  });

  it("renders source mix, ranked lists, and status mix", () => {
    render(
      <>
        <AnalyticsSourceBreakdown
          items={[
            { source: "google", patient_count: 640, revenue_cents: 1800000, share_pct: 38.0 },
            { source: "instagram", patient_count: 320, revenue_cents: 900000, share_pct: 19.0 }
          ]}
          onSelect={() => {}}
        />
        <AnalyticsRankedList
          title="Top Services"
          subtitle="Services producing the most demand and paid revenue"
          items={[
            { id: "svc_1", name: "botox", appointment_count: 220, revenue_cents: 4200000 }
          ]}
          kind="service"
          onSelect={() => {}}
        />
        <AnalyticsStatusMix
          items={[
            { status: "completed", count: 520 },
            { status: "cancelled", count: 41 }
          ]}
        />
      </>
    );

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("$18K")).toBeInTheDocument();
    expect(screen.getByText("Botox")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("41 · 7.3%")).toBeInTheDocument();
  });

  it("navigates to the patients page with drill-down filters", () => {
    pushMock.mockReset();

    render(
      <AnalyticsDashboardClient
        summary={{
          overview: {
            total_patients: 4000,
            total_appointments: 8200,
            total_providers: 12,
            total_services: 18,
            total_revenue_cents: 12500000,
            collection_rate_pct: 82.4,
            avg_revenue_per_patient_cents: 3125,
            avg_appointment_value_cents: 18400,
            active_patients: 1274,
            new_patients_30d: 48
          },
          revenue_trend: [
            { period: "2026-01", revenue_cents: 100000, appointment_count: 12 },
            { period: "2026-02", revenue_cents: 120000, appointment_count: 14 }
          ],
          patient_sources: [
            { source: "instagram", patient_count: 320, revenue_cents: 900000, share_pct: 55.0 },
            { source: "google", patient_count: 260, revenue_cents: 700000, share_pct: 45.0 }
          ],
          top_services: [
            { service_id: "svc_1", name: "botox injection", appointment_count: 220, revenue_cents: 4200000 }
          ],
          busiest_providers: [
            { provider_id: "prv_1", name: "Anthony Freeman", appointment_count: 190, revenue_cents: 3800000 }
          ],
          appointment_status_mix: [
            { status: "completed", count: 520 },
            { status: "cancelled", count: 41 }
          ]
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View patients from Instagram" }));
    expect(pushMock).toHaveBeenCalledWith("/patients?source=instagram");

    fireEvent.click(screen.getByRole("button", { name: "View patients for botox injection" }));
    expect(pushMock).toHaveBeenCalledWith("/patients?service=botox+injection");

    fireEvent.click(screen.getByRole("button", { name: "View patients for Anthony Freeman" }));
    expect(pushMock).toHaveBeenCalledWith("/patients?provider=Anthony+Freeman");

  });
});
