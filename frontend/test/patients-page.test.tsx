import { render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

const { getAllPatientsForDrilldownMock, fetchJsonMock } = vi.hoisted(() => ({
  getAllPatientsForDrilldownMock: vi.fn(),
  fetchJsonMock: vi.fn()
}));

vi.mock("@/lib/patients", async () => {
  const actual = await vi.importActual<typeof import("../lib/patients")>("../lib/patients");
  return {
    ...actual,
    getAllPatientsForDrilldown: getAllPatientsForDrilldownMock
  };
});

vi.mock("@/lib/api", () => ({
  fetchJson: fetchJsonMock
}));

vi.mock("@/components/patients/patient-table-toolbar", () => ({
  PatientTableToolbar: () => <div>Toolbar</div>
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
}));

import PatientsPage from "../app/patients/page";


describe("PatientsPage", () => {
  it("initializes provider drill-down filters from the query string", async () => {
    getAllPatientsForDrilldownMock.mockResolvedValue({
      total: 2,
      limit: 250,
      offset: 0,
      items: [
        {
          id: "pat_1",
          first_name: "Ana",
          last_name: "Stone",
          full_name: "Ana Stone",
          email: "ana@example.com",
          phone: "555-0100",
          address: "123 Main St",
          date_of_birth: "1990-01-01",
          source: "instagram",
          gender: "female",
          created_date: "2025-01-01T00:00:00",
          appointment_count: 3,
          paid_appointment_count: 2,
          lifetime_value_cents: 85000,
          last_appointment_date: "2025-06-01T00:00:00",
          last_paid_date: "2025-06-01T00:00:00",
          days_since_last_appointment: 10,
          preferred_provider_name: "Anthony Freeman",
          top_service_name: "Botox Injection",
          status: "active"
        },
        {
          id: "pat_2",
          first_name: "Jill",
          last_name: "Ray",
          full_name: "Jill Ray",
          email: "jill@example.com",
          phone: "555-0102",
          address: "700 Pine St",
          date_of_birth: "1990-02-01",
          source: "google",
          gender: "female",
          created_date: "2025-03-01T00:00:00",
          appointment_count: 2,
          paid_appointment_count: 2,
          lifetime_value_cents: 50000,
          last_appointment_date: "2025-05-01T00:00:00",
          last_paid_date: "2025-05-01T00:00:00",
          days_since_last_appointment: 15,
          preferred_provider_name: "Dr. Jane Smith",
          top_service_name: "Peel",
          status: "active"
        }
      ]
    });
    fetchJsonMock.mockResolvedValue({
      sources: ["instagram", "google"],
      service_count: 18,
      provider_count: 12
    });

    render(await PatientsPage({ searchParams: { provider: "Anthony Freeman" } }));

    expect(getAllPatientsForDrilldownMock).toHaveBeenCalled();
    expect(screen.getByText("Ana Stone")).toBeInTheDocument();
    expect(screen.queryByText("Jill Ray")).not.toBeInTheDocument();
  });
});
