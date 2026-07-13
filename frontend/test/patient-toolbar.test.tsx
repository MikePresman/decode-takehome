import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

const replaceMock = vi.fn();
let searchParams = new URLSearchParams("source=instagram&gender=female");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/patients",
  useSearchParams: () => searchParams
}));

import { PatientTableToolbar } from "../components/patients/patient-table-toolbar";


describe("PatientTableToolbar", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    searchParams = new URLSearchParams("source=instagram&gender=female");
  });

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

  it("updates view mode in query params", () => {
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.change(screen.getByLabelText("View"), {
      target: { value: "group_status" }
    });

    expect(replaceMock).toHaveBeenCalledWith("/patients?source=instagram&gender=female&view=group_status");
  });

  it("persists filters when switching to a grouped view", () => {
    searchParams = new URLSearchParams("source=instagram&status=active&gender=female");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.change(screen.getByLabelText("View"), {
      target: { value: "group_source" }
    });

    expect(replaceMock).toHaveBeenCalledWith("/patients?source=instagram&status=active&gender=female&view=group_source");
  });

  it("shows active filters as removable chips", () => {
    searchParams = new URLSearchParams("source=instagram&status=inactive&gender=female");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    expect(screen.getByRole("button", { name: "Source: Instagram ×" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Status: Inactive ×" })).toBeInTheDocument();
  });

  it("clears search, filters, and view state", () => {
    searchParams = new URLSearchParams("q=smith&source=instagram&status=active&gender=female&has_payments=true&view=group_source");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(replaceMock).toHaveBeenCalledWith("/patients");
  });

  it("removes a single filter through its chip", () => {
    searchParams = new URLSearchParams("source=instagram&status=inactive&gender=female");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Status: Inactive ×" }));

    expect(replaceMock).toHaveBeenCalledWith("/patients?source=instagram&gender=female");
  });

  it("shows grouping info when grouping matches an active filter", () => {
    searchParams = new URLSearchParams("source=google&view=group_source");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    expect(
      screen.getByText("Grouped by Source · filtered to Google, so only one group is shown.")
    ).toBeInTheDocument();
  });
});
