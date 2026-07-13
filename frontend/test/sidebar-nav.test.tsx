import { render, screen, within } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/patients"
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

import { SidebarNav } from "../components/sidebar-nav";


describe("SidebarNav", () => {
  it("renders primary navigation and highlights the active page", () => {
    render(<SidebarNav />);

    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primaryNav).getByText("Dashboard")).toBeInTheDocument();
    expect(within(primaryNav).getByText("Patients")).toBeInTheDocument();
    expect(within(primaryNav).getByText("AI Analytics")).toBeInTheDocument();

    const activeLink = within(primaryNav).getByRole("link", { name: /patients/i });
    expect(activeLink).toHaveAttribute("href", "/patients");
    expect(activeLink.className).toContain("bg-[#2a2420]");
  });

  it("renders utility items and the signed-in user block", () => {
    render(<SidebarNav />);

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Jessica Wu")).toBeInTheDocument();
    expect(screen.getByText("Front Desk")).toBeInTheDocument();
  });
});
