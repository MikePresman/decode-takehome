import { render, screen } from "@testing-library/react";

import { PatientDetailHeader } from "../components/patients/patient-detail-header";
import { PatientDetailSections } from "../components/patients/patient-detail-sections";


describe("Patient detail components", () => {
  it("renders patient identity and operational summary", () => {
    render(
      <>
        <PatientDetailHeader
          patient={{
            full_name: "Pat Example",
            email: "pat@example.com",
            phone: "555-0100",
            address: "123 Main St",
            source: "instagram",
            created_date: "2025-01-01T00:00:00",
            gender: "female",
            date_of_birth: "1980-01-01"
          }}
          status="active"
        />
        <PatientDetailSections
          detail={{
            patient: {
              id: "pat_123",
              first_name: "Pat",
              last_name: "Example",
              full_name: "Pat Example",
              email: "pat@example.com",
              phone: "555-0100",
              address: "123 Main St",
              date_of_birth: "1980-01-01",
              gender: "female",
              source: "instagram",
              created_date: "2025-01-01T00:00:00"
            },
            summary: {
              appointment_count: 5,
              completed_appointment_count: 3,
              cancelled_appointment_count: 1,
              no_show_appointment_count: 1,
              paid_appointment_count: 4,
              unpaid_appointment_count: 1,
              lifetime_value_cents: 124500,
              last_appointment_date: "2025-06-01T00:00:00",
              last_paid_date: "2025-06-01T00:00:00",
              days_since_last_appointment: 10,
              days_since_last_payment: 10,
              last_payment_method: "credit_card",
              preferred_provider_name: "Dr. Jane Smith",
              top_service_name: "Botox Injection",
              status: "active"
            },
            top_services: [{ service_id: "svc_1", name: "Botox Injection", count: 3 }],
            top_providers: [{ provider_id: "prv_1", name: "Dr. Jane Smith", count: 3 }],
            recent_payments: [
              {
                id: "pay_1",
                amount: 50000,
                date: "2025-06-01T00:00:00",
                method: "credit_card",
                status: "paid",
                service_id: "svc_1",
                service_name: "Botox Injection",
                provider_id: "prv_1",
                provider_name: "Dr. Jane Smith"
              }
            ],
            recent_appointments: [
              {
                id: "apt_1",
                created_date: "2025-06-01T00:00:00",
                status: "confirmed",
                service_names: ["Botox Injection"],
                provider_names: ["Dr. Jane Smith"]
              }
            ]
          }}
        />
      </>
    );

    expect(screen.getByText("Pat Example")).toBeInTheDocument();
    expect(screen.getByText("Preferred Provider")).toBeInTheDocument();
    expect(screen.getAllByText("Dr. Jane Smith")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Botox Injection")[0]).toBeInTheDocument();
    expect(screen.getByText("$1,245")).toBeInTheDocument();
    expect(screen.getByText("Unpaid Visits")).toBeInTheDocument();
    expect(screen.getByText("Credit Card")).toBeInTheDocument();
  });
});
