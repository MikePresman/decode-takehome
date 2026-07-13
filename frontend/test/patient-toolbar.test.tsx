import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

const replaceMock = vi.fn();
const searchParams = new URLSearchParams("source=instagram&gender=female");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/patients",
  useSearchParams: () => searchParams
}));

import { PatientTableToolbar } from "../components/patients/patient-table-toolbar";


describe("PatientTableToolbar", () => {
  it("debounces search input before updating query params", () => {
    vi.useFakeTimers();
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.change(screen.getByPlaceholderText("Search patients..."), {
      target: { value: "smith" }
    });

    expect(replaceMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(replaceMock).toHaveBeenCalledWith("/patients?source=instagram&gender=female&q=smith");
    vi.useRealTimers();
  });
});
