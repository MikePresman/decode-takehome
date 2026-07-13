"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatLabel } from "../../lib/patients";


function updateParams(
  pathname: string,
  searchParams: URLSearchParams,
  key: string,
  value: string | null
): Route {
  const next = new URLSearchParams(searchParams);

  if (!value || value === "all") {
    next.delete(key);
  } else {
    next.set(key, value);
  }

  if (key !== "offset") {
    next.delete("offset");
  }

  const query = next.toString();
  return (query ? `${pathname}?${query}` : pathname) as Route;
}


function updateView(pathname: string, searchParams: URLSearchParams, view: string): Route {
  const next = new URLSearchParams(searchParams);

  if (!view || view === "list") {
    next.delete("view");
  } else {
    next.set("view", view);
  }

  next.delete("offset");

  const query = next.toString();
  return (query ? `${pathname}?${query}` : pathname) as Route;
}


function clearSelection(pathname: string, searchParams: URLSearchParams): Route {
  const next = new URLSearchParams(searchParams);

  next.delete("q");
  next.delete("source");
  next.delete("status");
  next.delete("gender");
  next.delete("has_payments");
  next.delete("view");
  next.delete("offset");

  const query = next.toString();
  return (query ? `${pathname}?${query}` : pathname) as Route;
}


export function PatientTableToolbar({
  sources
}: {
  sources: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (searchValue !== current) {
        router.replace(updateParams(pathname, new URLSearchParams(searchParams.toString()), "q", searchValue || null));
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, searchValue]);

  const sourceValue = searchParams.get("source") ?? "all";
  const statusValue = searchParams.get("status") ?? "all";
  const genderValue = searchParams.get("gender") ?? "all";
  const paymentValue = searchParams.get("has_payments") ?? "all";
  const viewValue = searchParams.get("view") ?? "list";
  const viewLabel =
    viewValue === "group_status"
      ? "Grouped by Status"
      : viewValue === "group_source"
        ? "Grouped by Source"
        : viewValue === "group_practitioner"
          ? "Grouped by Practitioner"
          : "List";
  const hasActiveSelections =
    Boolean(searchParams.get("q")) ||
    sourceValue !== "all" ||
    statusValue !== "all" ||
    genderValue !== "all" ||
    paymentValue !== "all" ||
    viewValue !== "list";
  const activeFilters = [
    searchParams.get("q")
      ? { key: "q", label: `Search: ${searchParams.get("q")}` }
      : null,
    sourceValue !== "all"
      ? { key: "source", label: `Source: ${formatLabel(sourceValue)}` }
      : null,
    statusValue !== "all"
      ? { key: "status", label: `Status: ${formatLabel(statusValue)}` }
      : null,
    genderValue !== "all"
      ? { key: "gender", label: `Gender: ${formatLabel(genderValue)}` }
      : null,
    paymentValue !== "all"
      ? {
          key: "has_payments",
          label: paymentValue === "true" ? "Payment State: Has Payments" : "Payment State: No Payments"
        }
      : null
  ].filter((value): value is { key: string; label: string } => value !== null);
  const groupingInfo =
    viewValue === "group_source" && sourceValue !== "all"
      ? `Grouped by Source · filtered to ${formatLabel(sourceValue)}, so only one group is shown.`
      : viewValue === "group_status" && statusValue !== "all"
        ? `Grouped by Status · filtered to ${formatLabel(statusValue)}, so only one group is shown.`
        : null;

  return (
    <div className="border-b border-[#efe4d7] px-6 py-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-[#eadccc] bg-[#faf6ef] px-4 py-3 text-[#a48975]">
          <span className="text-sm">⌕</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search patients..."
            className="w-full bg-transparent text-sm text-[#5a4b3f] outline-none placeholder:text-[#a48975]"
          />
        </label>

          <div className="flex flex-wrap gap-2">
            <select
              value={sourceValue}
              onChange={(event) =>
                router.replace(updateParams(pathname, new URLSearchParams(searchParams.toString()), "source", event.target.value))
              }
              className="rounded-2xl border border-[#eadccc] bg-white px-4 py-3 text-sm font-medium text-[#5a4b3f]"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <select
              value={statusValue}
              onChange={(event) =>
                router.replace(updateParams(pathname, new URLSearchParams(searchParams.toString()), "status", event.target.value))
              }
              className="rounded-2xl border border-[#eadccc] bg-white px-4 py-3 text-sm font-medium text-[#5a4b3f]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New</option>
              <option value="never_paid">Never Paid</option>
            </select>

            <select
              value={genderValue}
              onChange={(event) =>
                router.replace(updateParams(pathname, new URLSearchParams(searchParams.toString()), "gender", event.target.value))
              }
              className="rounded-2xl border border-[#eadccc] bg-white px-4 py-3 text-sm font-medium text-[#5a4b3f]"
            >
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>

            <select
              value={paymentValue}
              onChange={(event) =>
                router.replace(
                  updateParams(pathname, new URLSearchParams(searchParams.toString()), "has_payments", event.target.value)
                )
              }
              className="rounded-2xl border border-[#eadccc] bg-white px-4 py-3 text-sm font-medium text-[#5a4b3f]"
            >
              <option value="all">All Payment States</option>
              <option value="true">Has Payments</option>
              <option value="false">No Payments</option>
            </select>

            <select
              aria-label="View"
              value={viewValue}
              onChange={(event) =>
                router.replace(updateView(pathname, new URLSearchParams(searchParams.toString()), event.target.value))
              }
              className="rounded-2xl border border-[#eadccc] bg-white px-4 py-3 text-sm font-medium text-[#5a4b3f]"
            >
              <option value="list">List</option>
              <option value="group_status">Grouped by Status</option>
              <option value="group_source">Grouped by Source</option>
              <option value="group_practitioner">Grouped by Practitioner</option>
            </select>

            {hasActiveSelections ? (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  router.replace(clearSelection(pathname, new URLSearchParams(searchParams.toString())));
                }}
                className="rounded-2xl border border-[#d9c7b5] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#8a5c36]"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  if (filter.key === "q") {
                    setSearchValue("");
                  }
                  router.replace(
                    updateParams(pathname, new URLSearchParams(searchParams.toString()), filter.key, null)
                  );
                }}
                className="rounded-full border border-[#e6d8c8] bg-[#faf6ef] px-3 py-1.5 text-sm text-[#725a48]"
              >
                {filter.label} ×
              </button>
            ))}
          </div>
        ) : null}

        {groupingInfo ? (
          <p className="text-sm text-[#9a7d67]">{groupingInfo}</p>
        ) : null}
      </div>
    </div>
  );
}
