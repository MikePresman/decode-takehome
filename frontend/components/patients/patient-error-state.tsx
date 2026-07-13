"use client";

import type { Route } from "next";
import Link from "next/link";


export function PatientErrorState({
  title,
  message,
  retryLabel = "Try again",
  onRetry,
  backHref,
  backLabel
}: {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  backHref?: Route;
  backLabel?: string;
}) {
  return (
    <section className="rounded-[32px] bg-white px-6 py-10 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">Unable to load data</p>
        <h1 className="mt-4 text-[2rem] font-semibold text-[#26211d]">{title}</h1>
        <p className="mt-4 text-[15px] leading-7 text-[#7f6754]">{message}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-2xl bg-[#1f1b18] px-5 py-3 text-sm font-semibold text-white"
            >
              {retryLabel}
            </button>
          ) : null}
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className="rounded-2xl border border-[#e6d8c8] bg-[#faf6ef] px-5 py-3 text-sm font-semibold text-[#5a4b3f]"
            >
              {backLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
