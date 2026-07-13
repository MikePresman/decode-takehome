import { fireEvent, render, screen } from "@testing-library/react";
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

import { PatientErrorState } from "../components/patients/patient-error-state";


describe("PatientErrorState", () => {
  it("renders retry and back actions", () => {
    const onRetry = vi.fn();

    render(
      <PatientErrorState
        title="The patient roster is temporarily unavailable"
        message="There was a problem loading patients."
        onRetry={onRetry}
        backHref="/patients"
        backLabel="Back to Patients"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to Patients" })).toHaveAttribute("href", "/patients");
  });
});
