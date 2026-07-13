import { render, screen, within } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

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

import { PatientTable } from "../components/patients/patient-table";


describe("PatientTable", () => {
  it("renders rows with operational columns and detail links", () => {
    render(
      <PatientTable
        items={[
          {
            id: "pat_123",
            first_name: "Pat",
            last_name: "Example",
            full_name: "Pat Example",
            email: "pat@example.com",
            phone: "555-0100",
            address: "123 Main St",
            date_of_birth: "1980-01-01",
            source: "instagram",
            gender: "female",
            created_date: "2025-01-01T00:00:00",
            appointment_count: 5,
            paid_appointment_count: 4,
            lifetime_value_cents: 124500,
            last_appointment_date: "2025-06-01T00:00:00",
            last_paid_date: "2025-06-01T00:00:00",
            days_since_last_appointment: 10,
            preferred_provider_name: "Dr. Jane Smith",
            top_service_name: "Botox Injection",
            status: "active"
          }
        ]}
        total={1}
        limit={50}
        offset={0}
        currentSort="created_date"
        currentOrder="desc"
        currentView="list"
        currentQuery={new URLSearchParams()}
      />
    );

    expect(screen.getByText("Pat Example")).toBeInTheDocument();
    expect(screen.getByText("555-0100")).toBeInTheDocument();
    expect(screen.getByText("Dr. Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("$1,245")).toBeInTheDocument();

    const activeBadge = screen.getByText("Active");
    expect(activeBadge).toBeInTheDocument();

    const patientLink = screen.getByRole("link", { name: /pat example/i });
    expect(patientLink).toHaveAttribute("href", "/patients/pat_123");

    const table = screen.getByRole("table");
    expect(within(table).getByText("Last Visit")).toBeInTheDocument();
  });

  it("renders grouped sections when grouped view is enabled", () => {
    render(
      <PatientTable
        items={[
          {
            id: "pat_123",
            first_name: "Pat",
            last_name: "Example",
            full_name: "Pat Example",
            email: "pat@example.com",
            phone: "555-0100",
            address: "123 Main St",
            date_of_birth: "1980-01-01",
            source: "instagram",
            gender: "female",
            created_date: "2025-01-01T00:00:00",
            appointment_count: 5,
            paid_appointment_count: 4,
            lifetime_value_cents: 124500,
            last_appointment_date: "2025-06-01T00:00:00",
            last_paid_date: "2025-06-01T00:00:00",
            days_since_last_appointment: 10,
            preferred_provider_name: "Dr. Jane Smith",
            top_service_name: "Botox Injection",
            status: "active"
          },
          {
            id: "pat_456",
            first_name: "Sam",
            last_name: "Stone",
            full_name: "Sam Stone",
            email: "sam@example.com",
            phone: "555-0101",
            address: "500 Oak St",
            date_of_birth: "1985-05-01",
            source: "google",
            gender: "male",
            created_date: "2025-02-01T00:00:00",
            appointment_count: 1,
            paid_appointment_count: 0,
            lifetime_value_cents: 0,
            last_appointment_date: "2025-04-01T00:00:00",
            last_paid_date: null,
            days_since_last_appointment: 20,
            preferred_provider_name: null,
            top_service_name: "Consultation",
            status: "never_paid"
          }
        ]}
        total={2}
        limit={50}
        offset={0}
        currentSort="created_date"
        currentOrder="desc"
        currentView="group_status"
        currentQuery={new URLSearchParams("view=group_status&status=active")}
      />
    );

    expect(screen.getByText(/view/i)).toBeInTheDocument();
    expect(screen.getAllByText("Active")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Never Paid")[0]).toBeInTheDocument();
    expect(screen.getByText("Active · 1 patient")).toBeInTheDocument();
    expect(screen.getByText("Never Paid · 1 patient")).toBeInTheDocument();
  });

  it("shows correct group counts after filters are applied", () => {
    render(
      <PatientTable
        items={[
          {
            id: "pat_123",
            first_name: "Pat",
            last_name: "Example",
            full_name: "Pat Example",
            email: "pat@example.com",
            phone: "555-0100",
            address: "123 Main St",
            date_of_birth: "1980-01-01",
            source: "google",
            gender: "female",
            created_date: "2025-01-01T00:00:00",
            appointment_count: 5,
            paid_appointment_count: 4,
            lifetime_value_cents: 124500,
            last_appointment_date: "2025-06-01T00:00:00",
            last_paid_date: "2025-06-01T00:00:00",
            days_since_last_appointment: 10,
            preferred_provider_name: "Dr. Jane Smith",
            top_service_name: "Botox Injection",
            status: "active"
          },
          {
            id: "pat_789",
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
        ]}
        total={2}
        limit={50}
        offset={0}
        currentSort="created_date"
        currentOrder="desc"
        currentView="group_source"
        currentQuery={new URLSearchParams("view=group_source&source=google")}
      />
    );

    expect(screen.getByText("Google · 2 patients")).toBeInTheDocument();
  });
});
