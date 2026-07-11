const patientStats = [
  {
    label: "Total Patients",
    value: "4,000",
    note: "Loaded roster",
    icon: "◎"
  },
  {
    label: "Active",
    value: "3,128",
    note: "Seen in last 12 months",
    icon: "∿"
  },
  {
    label: "New This Month",
    value: "126",
    note: "+19 this week",
    icon: "+"
  },
  {
    label: "Avg Lifetime Value",
    value: "$1,842",
    note: "+8.4% vs prior quarter",
    icon: "$"
  }
];

const patients = [
  ["Monica Patel", "m.patel@beauty.com", "(310) 555-0227", "Referral", "May 12, 2024", "26", "Jul 9, 2025", "$15,400", "Active"],
  ["Olivia Parker", "o.parker@gmail.com", "(310) 555-0191", "Referral", "Jun 18, 2024", "22", "Jul 8, 2025", "$12,100", "Active"],
  ["Catherine Lee", "c.lee@gmail.com", "(213) 555-0155", "Referral", "Jul 30, 2024", "18", "Jun 30, 2025", "$9,800", "Active"],
  ["Amanda Rivera", "amanda.r@email.com", "(213) 555-0142", "Referral", "Aug 22, 2024", "14", "Jul 2, 2025", "$8,650", "Active"],
  ["Natalie Brooks", "n.brooks@email.com", "(310) 555-0219", "Google", "Sep 14, 2024", "11", "Jul 5, 2025", "$6,240", "Active"],
  ["Lauren Davis", "l.davis@email.com", "(424) 555-0161", "Website", "Oct 17, 2024", "9", "Jul 1, 2025", "$5,100", "Active"],
  ["Jessica Thompson", "jessica.t@gmail.com", "(424) 555-0178", "Instagram", "Jan 15, 2025", "8", "Jun 28, 2025", "$4,280", "Active"],
  ["Christine Ford", "c.ford@email.com", "(424) 555-0145", "Walk-in", "Aug 8, 2024", "7", "Apr 15, 2025", "$3,960", "Inactive"]
];

const statusClasses: Record<string, string> = {
  Active: "bg-[#e7efe4] text-[#5f8b5c]",
  Inactive: "bg-[#f4ebe7] text-[#a57263]"
};

const sourceClasses: Record<string, string> = {
  Referral: "bg-[#f3ead9] text-[#be8a3f]",
  Google: "bg-[#e2efe2] text-[#6d9466]",
  Website: "bg-[#ece8f8] text-[#7e71bd]",
  Instagram: "bg-[#e5eff0] text-[#5d8f93]",
  "Walk-in": "bg-[#f2e7e0] text-[#b27f6d]"
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PatientsPage() {
  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[2.25rem] font-semibold leading-none text-[#26211d]">
            Patients
          </h1>
          <p className="mt-3 text-lg text-[#9a7d67]">
            Manage and review your patient roster.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-[#e6d9c8] bg-white px-5 py-3 text-sm font-semibold text-[#3f342b]">
            Export
          </button>
          <button className="rounded-2xl bg-[#1f1b18] px-5 py-3 text-sm font-semibold text-white">
            Add Patient
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {patientStats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
                  {stat.label}
                </p>
                <p className="mt-8 text-[3rem] font-semibold leading-none text-[#26211d]">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm font-medium text-[#a18672]">{stat.note}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe5] text-lg text-[#c08a46]">
                {stat.icon}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-[32px] bg-white shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
        <div className="flex flex-col gap-4 border-b border-[#efe4d7] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-[260px] items-center gap-3 rounded-2xl border border-[#eadccc] bg-[#faf6ef] px-4 py-3 text-[#a48975]">
              <span className="text-sm">⌕</span>
              <span className="text-sm">Search patients...</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              {["All", "Active", "Inactive", "New"].map((filter, index) => (
                <button
                  key={filter}
                  className={[
                    "rounded-2xl px-4 py-3",
                    index === 0
                      ? "bg-[#1f1b18] text-white"
                      : "text-[#9a7d67] hover:bg-[#f4ebdf]"
                  ].join(" ")}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm font-medium text-[#a18672]">4,000 patients</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-[#efe4d7] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a7d67]">
                <th className="px-6 py-5 text-base normal-case tracking-normal text-[#725a48]">
                  Patient
                </th>
                <th className="px-4 py-5">Phone</th>
                <th className="px-4 py-5">Source</th>
                <th className="px-4 py-5">Since</th>
                <th className="px-4 py-5">Visits</th>
                <th className="px-4 py-5">Last Visit</th>
                <th className="px-4 py-5">LTV</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(([name, email, phone, source, since, visits, lastVisit, ltv, status]) => (
                <tr key={email} className="border-b border-[#f4eadf] text-[15px]">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e6d7] text-sm font-semibold text-[#ad845a]">
                        {initials(name)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#2d2723]">{name}</p>
                        <p className="text-sm text-[#9a7d67]">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-[#5a4b3f]">{phone}</td>
                  <td className="px-4 py-5">
                    <span className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${sourceClasses[source]}`}>
                      {source}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-[#8f7662]">{since}</td>
                  <td className="px-4 py-5 font-semibold text-[#2d2723]">{visits}</td>
                  <td className="px-4 py-5 text-[#5a4b3f]">{lastVisit}</td>
                  <td className="px-4 py-5 font-semibold text-[#2d2723]">{ltv}</td>
                  <td className="px-6 py-5">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[status]}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {[
          {
            title: "Front desk sorting priorities",
            body: "Default sort should favor recent visits and lifetime value so staff can quickly identify active and high-context patients."
          },
          {
            title: "Useful filters",
            body: "Source, status, last-visit recency, and new-patient cohorts are the highest leverage filters for day-to-day roster review."
          },
          {
            title: "AI-ready metadata",
            body: "Each row maps cleanly to patient, source, visit cadence, and revenue measures so future natural-language queries have stable dimensions."
          }
        ].map((card) => (
          <article
            key={card.title}
            className="rounded-[28px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
          >
            <h2 className="text-xl font-semibold text-[#2d2723]">{card.title}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#8f7662]">{card.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
