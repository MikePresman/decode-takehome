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

  it("clears the matching filter when switching to a grouped view", () => {
    searchParams = new URLSearchParams("source=instagram&status=active&gender=female");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.change(screen.getByLabelText("View"), {
      target: { value: "group_source" }
    });

    expect(replaceMock).toHaveBeenCalledWith("/patients?status=active&gender=female&view=group_source");
  });

  it("hides the source filter while grouped by source", () => {
    searchParams = new URLSearchParams("view=group_source&gender=female");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    expect(screen.queryByDisplayValue("All Sources")).not.toBeInTheDocument();
    expect(screen.getByLabelText("View")).toHaveValue("group_source");
  });

  it("clears search, filters, and view state", () => {
    searchParams = new URLSearchParams("q=smith&source=instagram&status=active&gender=female&has_payments=true&view=group_source");
    render(<PatientTableToolbar sources={["instagram", "google"]} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(replaceMock).toHaveBeenCalledWith("/patients");
  });
});
