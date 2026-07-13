import type { Route } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { formatCurrency, formatDate, formatLabel, formatRelativeDays, type PatientListItem } from "../../lib/patients";
import { PatientStatusBadge } from "./patient-status-badge";


function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


function SourceBadge({ source }: { source: string }) {
  return (
    <span className="rounded-xl bg-[#f3ead9] px-3 py-1.5 text-xs font-semibold capitalize text-[#8a6a45]">
      {source.replaceAll("_", " ")}
    </span>
  );
}


export function PatientTable({
  items,
  total,
  limit,
  offset,
  currentSort,
  currentOrder,
  currentView,
  currentQuery
}: {
  items: PatientListItem[];
  total: number;
  limit: number;
  offset: number;
  currentSort: string;
  currentOrder: string;
  currentView: string;
  currentQuery: URLSearchParams;
}) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function sortHref(sortKey: string): Route {
    const next = new URLSearchParams(currentQuery.toString());
    const nextOrder = currentSort === sortKey && currentOrder === "desc" ? "asc" : "desc";
    next.set("sort", sortKey);
    next.set("order", nextOrder);
    next.delete("offset");
    return `?${next.toString()}` as Route;
  }

  function pageHref(nextOffset: number): Route {
    const next = new URLSearchParams(currentQuery.toString());
    next.set("offset", String(nextOffset));
    return `?${next.toString()}` as Route;
  }

  function groupConfig(patient: PatientListItem): { key: string; label: string } {
    switch (currentView) {
      case "group_status":
        return { key: patient.status, label: formatLabel(patient.status) };
      case "group_source":
        return { key: patient.source, label: formatLabel(patient.source) };
      case "group_practitioner":
        return {
          key: patient.preferred_provider_name ?? "unassigned",
          label: patient.preferred_provider_name ?? "Unassigned Practitioner"
        };
      default:
        return { key: "all", label: "All Patients" };
    }
  }

  const groupedItems = items.reduce<Array<{ key: string; label: string; items: PatientListItem[] }>>((groups, patient) => {
    const group = groupConfig(patient);
    const existing = groups.find((entry) => entry.key === group.key);

    if (existing) {
      existing.items.push(patient);
      return groups;
    }

    groups.push({
      key: group.key,
      label: group.label,
      items: [patient]
    });
    return groups;
  }, []);

  const showGrouping = currentView !== "list";
  const viewLabel =
    currentView === "group_status"
      ? "Grouped by Status"
      : currentView === "group_source"
        ? "Grouped by Source"
        : currentView === "group_practitioner"
          ? "Grouped by Practitioner"
          : "List";

  return (
    <section className="overflow-hidden rounded-[32px] bg-white shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      {showGrouping ? (
        <div className="border-b border-[#efe4d7] bg-[#fcf8f2] px-6 py-4 text-sm text-[#7f6754]">
          View <span className="font-semibold text-[#2d2723]">{viewLabel}</span> on the current result set.
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-[#efe4d7] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a7d67]">
              <th className="px-6 py-5 text-base normal-case tracking-normal text-[#725a48]">
                <Link href={sortHref("full_name")} className="hover:text-[#2d2723]">
                  Patient
                </Link>
              </th>
              <th className="px-4 py-5">Phone</th>
              <th className="px-4 py-5">Source</th>
              <th className="px-4 py-5">
                <Link href={sortHref("created_date")} className="hover:text-[#2d2723]">
                  Since
                </Link>
              </th>
              <th className="px-4 py-5">
                <Link href={sortHref("appointment_count")} className="hover:text-[#2d2723]">
                  Visits
                </Link>
              </th>
              <th className="px-4 py-5">
                <Link href={sortHref("last_appointment_date")} className="hover:text-[#2d2723]">
                  Last Visit
                </Link>
              </th>
              <th className="px-4 py-5">
                <Link href={sortHref("lifetime_value_cents")} className="hover:text-[#2d2723]">
                  LTV
                </Link>
              </th>
              <th className="px-4 py-5">Provider</th>
              <th className="px-6 py-5">Status</th>
            </tr>
          </thead>
          <tbody>
            {groupedItems.map((group) => (
              <Fragment key={group.key}>
                {showGrouping ? (
                  <tr className="border-b border-[#eadccc] bg-[#faf6ef] text-sm text-[#725a48]">
                    <td colSpan={9} className="px-6 py-3">
                      <span className="font-semibold">
                        {group.label} · {group.items.length} patient{group.items.length === 1 ? "" : "s"}
                      </span>
                    </td>
                  </tr>
                ) : null}
                {group.items.map((patient) => (
                  <tr key={patient.id} className="border-b border-[#f4eadf] text-[15px]">
                    <td className="px-6 py-5">
                      <Link href={`/patients/${patient.id}` as Route} className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e6d7] text-sm font-semibold text-[#ad845a]">
                          {initials(patient.full_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#2d2723]">{patient.full_name}</p>
                          <p className="text-sm text-[#9a7d67]">{patient.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-5 text-[#5a4b3f]">{patient.phone}</td>
                    <td className="px-4 py-5">
                      <SourceBadge source={patient.source} />
                    </td>
                    <td className="px-4 py-5 text-[#8f7662]">{formatDate(patient.created_date)}</td>
                    <td className="px-4 py-5 font-semibold text-[#2d2723]">{patient.appointment_count}</td>
                    <td className="px-4 py-5 text-[#5a4b3f]">
                      <div>{formatDate(patient.last_appointment_date)}</div>
                      <div className="text-xs text-[#9a7d67]">
                        {formatRelativeDays(patient.days_since_last_appointment)}
                      </div>
                    </td>
                    <td className="px-4 py-5 font-semibold text-[#2d2723]">
                      {formatCurrency(patient.lifetime_value_cents)}
                    </td>
                    <td className="px-4 py-5 text-[#5a4b3f]">{patient.preferred_provider_name ?? "—"}</td>
                    <td className="px-6 py-5">
                      <PatientStatusBadge status={patient.status} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#efe4d7] px-6 py-4 text-sm text-[#8f7662]">
        <p>
          Showing {items.length === 0 ? 0 : offset + 1}-{Math.min(offset + items.length, total)} of {total}
        </p>
        <div className="flex items-center gap-3">
          {page > 1 ? (
            <Link href={pageHref(Math.max(0, offset - limit))} className="rounded-xl bg-[#f6efe5] px-3 py-2 text-[#5a4b3f]">
              Previous
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="rounded-xl bg-[#f6efe5] px-3 py-2 text-[#c9baa8]"
            >
              Previous
            </span>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(offset + limit)} className="rounded-xl bg-[#1f1b18] px-3 py-2 text-white">
              Next
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="rounded-xl bg-[#f6efe5] px-3 py-2 text-[#c9baa8]"
            >
              Next
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
