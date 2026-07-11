const questionExamples = [
  "Which referral channels are producing high-value patients but low visit frequency?",
  "Show providers with the strongest revenue growth but declining retention.",
  "Which services drive repeat visits within 90 days of a first appointment?",
  "Which patient cohorts are most likely to churn after an unpaid appointment?"
];

const architectureBlocks = [
  {
    title: "Semantic Query Layer",
    body: "Expose stable business concepts like patient, visit cadence, paid revenue, provider utilization, acquisition source, and service mix through a dedicated analytics service layer."
  },
  {
    title: "Trusted Dimensions",
    body: "Define reusable dimensions and metrics centrally so an AI workflow can ask for cohorts, date grains, conversion rates, and lifetime value without reading raw tables directly."
  },
  {
    title: "Governed Execution",
    body: "Route natural-language questions into structured query plans, not ad hoc SQL generation. That keeps answers explainable, testable, and safer during the technical interview extension."
  }
];

const metricCatalog = [
  ["Patient", "source, created_at, status, last_visit_at, lifetime_value_cents"],
  ["Appointment", "scheduled_at, completed_at, status, provider_id, service_count"],
  ["Revenue", "paid_amount_cents, collection_rate, avg_ticket, revenue_period"],
  ["Retention", "days_since_last_visit, repeat_rate, rebook_window, churn_risk"]
];

export default function AiGeniePage() {
  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[2.25rem] font-semibold leading-none text-[#26211d]">
            AI Genie
          </h1>
          <p className="mt-3 max-w-4xl text-lg text-[#9a7d67]">
            The AI-ready layer for arbitrary questions about patients, revenue,
            retention, and provider performance.
          </p>
        </div>
        <div className="rounded-2xl border border-[#e6d9c8] bg-white px-5 py-4 text-sm font-semibold text-[#5e4d3d]">
          Interview extension ready
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            Product Intent
          </p>
          <h2 className="mt-4 text-[2rem] font-semibold leading-tight text-[#2d2723]">
            Build the dashboard so AI can answer business questions without bypassing domain logic.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-[#8f7662]">
            The core idea is simple: pages use the same structured metrics layer that
            an AI assistant would use later. That keeps the UI, API, and future
            question-answering system aligned around the same definitions.
          </p>
        </article>

        <article className="rounded-[32px] bg-[#1f1b18] px-6 py-6 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a8a7d]">
            Suggested questions
          </p>
          <ul className="mt-5 space-y-4 text-[15px] leading-7 text-[#e9ddd0]">
            {questionExamples.map((question) => (
              <li key={question} className="rounded-2xl bg-white/6 px-4 py-4">
                {question}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {architectureBlocks.map((block) => (
          <article
            key={block.title}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
          >
            <h2 className="text-xl font-semibold text-[#2d2723]">{block.title}</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#8f7662]">{block.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
              Metric catalog
            </p>
            <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">
              Query surfaces that the UI and AI can share
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[#efe4d7]">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[#efe4d7] bg-[#fbf7f1] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a7d67]">
                  <th className="px-5 py-4">Domain</th>
                  <th className="px-5 py-4">Shared dimensions and metrics</th>
                </tr>
              </thead>
              <tbody>
                {metricCatalog.map(([domain, fields]) => (
                  <tr key={domain} className="border-b border-[#f4eadf] last:border-b-0">
                    <td className="px-5 py-4 text-[15px] font-semibold text-[#2d2723]">
                      {domain}
                    </td>
                    <td className="px-5 py-4 text-[15px] leading-7 text-[#8f7662]">
                      {fields}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
            Execution flow
          </p>
          <ol className="mt-6 space-y-5">
            {[
              "Interpret the question into business intent and target entities.",
              "Resolve allowed metrics, filters, and date grains from a central analytics schema.",
              "Execute structured repository or service-layer queries against Postgres.",
              "Return an answer with supporting numbers, breakdowns, and traceable assumptions."
            ].map((step, index) => (
              <li key={step} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3eadf] text-sm font-semibold text-[#b68443]">
                  {index + 1}
                </div>
                <p className="pt-1 text-[15px] leading-7 text-[#8f7662]">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-[24px] bg-[#f8f2ea] px-5 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a07e62]">
              Why this matters
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#7f6755]">
              During the technical meeting, the AI extension should be a natural
              continuation of the architecture, not a separate spike. This page makes
              that system visible and concrete.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
