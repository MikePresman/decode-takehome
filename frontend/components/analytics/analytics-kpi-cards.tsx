"use client";

import { useEffect, useRef, useState } from "react";

import { type AnalyticsSummaryResponse, getKpiCards } from "../../lib/analytics";


function AnimatedNumber({
  value,
  formatter
}: {
  value: number;
  formatter: (value: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const duration = 450;
    const startedAt = performance.now();

    let frame = 0;
    const step = (timestamp: number) => {
      const elapsed = timestamp - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = start + (end - start) * eased;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        previousValue.current = end;
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{formatter(displayValue)}</>;
}


export function AnalyticsKpiCards({
  overview,
  rangeKey
}: {
  overview: AnalyticsSummaryResponse["overview"];
  rangeKey: string;
}) {
  const cards = getKpiCards(overview);

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={`${rangeKey}-${card.label}`}
          className="rounded-[30px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)] transition-transform duration-300"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            {card.label}
          </p>
          <p className="mt-8 text-[3rem] font-semibold leading-none text-[#26211d]">
            <AnimatedNumber value={card.value} formatter={card.formatter} />
          </p>
          <p className={`mt-3 text-sm font-medium ${card.accent}`}>{card.note}</p>
        </article>
      ))}
    </section>
  );
}
