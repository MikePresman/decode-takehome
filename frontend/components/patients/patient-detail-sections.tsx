import { formatCurrency, formatDate, formatLabel, formatRelativeDays, type PatientDetailResponse } from "../../lib/patients";


export function PatientDetailSections({ detail }: { detail: PatientDetailResponse }) {
  const { summary, top_services, top_providers, recent_payments, recent_appointments } = detail;
  const cards = [
    { label: "Total Visits", value: String(summary.appointment_count), note: "Appointments on record" },
    { label: "Paid Visits", value: String(summary.paid_appointment_count), note: "Appointments with successful payments" },
    { label: "Lifetime Value", value: formatCurrency(summary.lifetime_value_cents), note: "Paid revenue in cents" },
    { label: "Last Visit", value: formatDate(summary.last_appointment_date), note: formatRelativeDays(summary.days_since_last_appointment) }
  ];
  const operatorSignals = [
    {
      label: "Unpaid Visits",
      value: String(summary.unpaid_appointment_count),
      tone: summary.unpaid_appointment_count > 0 ? "text-[#9c5d2d]" : "text-[#2d2723]"
    },
    {
      label: "Cancelled",
      value: String(summary.cancelled_appointment_count),
      tone: summary.cancelled_appointment_count > 0 ? "text-[#9c5d2d]" : "text-[#2d2723]"
    },
    {
      label: "No-Show",
      value: String(summary.no_show_appointment_count),
      tone: summary.no_show_appointment_count > 0 ? "text-[#aa4b43]" : "text-[#2d2723]"
    },
    {
      label: "Completed",
      value: String(summary.completed_appointment_count),
      tone: "text-[#2d2723]"
    }
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">{card.label}</p>
            <p className="mt-6 text-[2rem] font-semibold text-[#26211d]">{card.value}</p>
            <p className="mt-3 text-sm text-[#8f7662]">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-xl font-semibold text-[#2d2723]">Operational Snapshot</h2>
          <dl className="mt-5 grid gap-4 text-[15px] text-[#5a4b3f]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8f7662]">Preferred Provider</dt>
              <dd>{summary.preferred_provider_name ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8f7662]">Top Service</dt>
              <dd>{summary.top_service_name ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8f7662]">Last Paid Visit</dt>
              <dd>{formatDate(summary.last_paid_date)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8f7662]">Last Payment Method</dt>
              <dd>{summary.last_payment_method ? formatLabel(summary.last_payment_method) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#8f7662]">Time Since Payment</dt>
              <dd>{formatRelativeDays(summary.days_since_last_payment)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-xl font-semibold text-[#2d2723]">Top Services</h2>
          <ul className="mt-5 space-y-3">
            {top_services.map((service) => (
              <li key={service.service_id} className="flex items-center justify-between gap-3 text-[15px]">
                <span className="text-[#5a4b3f]">{service.name}</span>
                <span className="font-semibold text-[#2d2723]">{service.count}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {operatorSignals.map((signal) => (
          <article
            key={signal.label}
            className="rounded-[28px] bg-[#fffaf3] px-6 py-5 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">{signal.label}</p>
            <p className={`mt-4 text-[1.75rem] font-semibold ${signal.tone}`}>{signal.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-xl font-semibold text-[#2d2723]">Top Providers</h2>
          <ul className="mt-5 space-y-3">
            {top_providers.map((provider) => (
              <li key={provider.provider_id} className="flex items-center justify-between gap-3 text-[15px]">
                <span className="text-[#5a4b3f]">{provider.name}</span>
                <span className="font-semibold text-[#2d2723]">{provider.count}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-xl font-semibold text-[#2d2723]">Recent Payments</h2>
          <ul className="mt-5 space-y-3">
            {recent_payments.length === 0 ? (
              <li className="text-[15px] text-[#8f7662]">No payments on record.</li>
            ) : (
              recent_payments.slice(0, 5).map((payment) => (
                <li key={payment.id} className="flex items-start justify-between gap-3 text-[15px]">
                  <div>
                    <span className="text-[#5a4b3f]">{formatDate(payment.date)}</span>
                    <p className="mt-1 text-sm text-[#8f7662]">
                      {payment.service_name ?? "Unknown service"} with {payment.provider_name ?? "unknown provider"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#b08c6c]">
                      {formatLabel(payment.method)} · {formatLabel(payment.status)}
                    </p>
                  </div>
                  <span className="font-semibold text-[#2d2723]">{formatCurrency(payment.amount)}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
        <h2 className="text-xl font-semibold text-[#2d2723]">Recent Appointments</h2>
        <ul className="mt-5 space-y-3">
          {recent_appointments.map((appointment) => (
            <li key={appointment.id} className="flex items-start justify-between gap-3 text-[15px]">
              <div>
                <span className="text-[#5a4b3f]">{formatDate(appointment.created_date)}</span>
                <p className="mt-1 text-sm text-[#8f7662]">
                  {appointment.service_names.length > 0 ? appointment.service_names.join(", ") : "No services recorded"}
                </p>
                <p className="mt-1 text-sm text-[#b08c6c]">
                  {appointment.provider_names.length > 0 ? appointment.provider_names.join(", ") : "No providers recorded"}
                </p>
              </div>
              <span className="capitalize text-[#8f7662]">{formatLabel(appointment.status)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
