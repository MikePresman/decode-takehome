"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";


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

  return (
    <div className="flex flex-col gap-4 border-b border-[#efe4d7] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
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
        </div>
      </div>
    </div>
  );
}
