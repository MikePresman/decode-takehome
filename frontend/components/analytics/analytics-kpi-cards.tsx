import { type AnalyticsSummaryResponse, getKpiCards } from "../../lib/analytics";


export function AnalyticsKpiCards({
  overview
}: {
  overview: AnalyticsSummaryResponse["overview"];
}) {
  const cards = getKpiCards(overview);

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[30px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            {card.label}
          </p>
          <p className="mt-8 text-[3rem] font-semibold leading-none text-[#26211d]">
            {card.value}
          </p>
          <p className={`mt-3 text-sm font-medium ${card.accent}`}>{card.note}</p>
        </article>
      ))}
    </section>
  );
}
