const topMetrics = [
  ["Revenue MTD", "$29,800", "+7.2% vs last month", "$"],
  ["Active Patients", "1,247", "+48 new this month", "◎"],
  ["Appointments", "233", "+4.1%  88% completion", "⌘"],
  ["Avg Lifetime Value", "$2,280", "+12% vs prior quarter", "↗"]
];

const services = [
  ["Botox / Dysport", "$84,200", "312 appts", "100%"],
  ["Filler (Juvederm)", "$62,800", "184 appts", "75%"],
  ["Hydrafacial", "$38,400", "288 appts", "46%"],
  ["Sculptra", "$28,600", "68 appts", "34%"],
  ["Microneedling", "$21,200", "156 appts", "25%"]
];

const providers = [
  ["EV", "Dr. Elena Vasquez", "Medical Director", "$94,200", "312 appts", "4.9"],
  ["JP", "Dr. James Park", "Physician", "$72,800", "244 appts", "4.8"],
  ["MT", "Megan Torres, PA-C", "Physician Assistant", "$56,400", "198 appts", "4.9"],
  ["NK", "Natasha Klein, RN", "Injector", "$48,600", "176 appts", "4.7"]
];

const sourceBreakdown = [
  ["Referral", "38%", "#c78f46"],
  ["Instagram", "26%", "#6d9da0"],
  ["Google", "19%", "#7fa17b"],
  ["Website", "11%", "#cf7e73"],
  ["Walk-in", "6%", "#8c79c7"]
];

const revenuePoints = [16000, 18500, 19600, 20800, 24000, 27800, 28200];

function trendPolyline() {
  const width = 100;
  const height = 40;
  const max = Math.max(...revenuePoints);
  const min = Math.min(...revenuePoints);
  return revenuePoints
    .map((point, index) => {
      const x = (index / (revenuePoints.length - 1)) * width;
      const y = height - ((point - min) / (max - min)) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function AnalyticsPage() {
  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[2.25rem] font-semibold leading-none text-[#26211d]">
            Analytics
          </h1>
          <p className="mt-3 text-lg text-[#9a7d67]">
            Performance overview · Beauty Med Spa
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-[#e6d9c8] bg-white px-5 py-3 text-sm font-semibold text-[#3f342b]">
            Jul 2025
          </button>
          <button className="rounded-2xl bg-[#1f1b18] px-5 py-3 text-sm font-semibold text-white">
            Export
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {topMetrics.map(([label, value, note, icon]) => (
          <article
            key={label}
            className="rounded-[30px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9f846e]">
                  {label}
                </p>
                <p className="mt-8 text-[3rem] font-semibold leading-none text-[#26211d]">
                  {value}
                </p>
                <p className="mt-3 text-sm font-medium text-[#6d9466]">{note}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe5] text-lg text-[#c08a46]">
                {icon}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Revenue Trend</h2>
              <p className="text-[15px] text-[#9a7d67]">Year-over-year comparison</p>
            </div>
            <div className="flex gap-6 text-sm font-semibold text-[#9a7d67]">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-6 bg-[#c88e45]" />
                2025
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-6 bg-[#d8cec0]" />
                2024
              </span>
            </div>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
              <div className="flex flex-col justify-between py-4 text-sm font-medium text-[#a18672]">
                <span>$32k</span>
                <span>$24k</span>
                <span>$16k</span>
                <span>$8k</span>
                <span>$0k</span>
              </div>
              <div className="relative h-[260px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf4_100%)]">
                <div className="absolute inset-0">
                  {[20, 40, 60, 80].map((top) => (
                    <div
                      key={top}
                      className="absolute left-0 right-0 border-t border-dashed border-[#f0e3d5]"
                      style={{ top: `${top}%` }}
                    />
                  ))}
                </div>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-6 top-6 h-[180px] w-[calc(100%-3rem)]">
                  <defs>
                    <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#d8b17a" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#d8b17a" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <polygon points={`0,40 ${trendPolyline()} 100,40`} fill="url(#revenueFill)" />
                  <polyline points={trendPolyline()} fill="none" stroke="#c78f46" strokeWidth="0.7" />
                  {trendPolyline().split(" ").map((point) => {
                    const [x, y] = point.split(",");
                    return <circle key={point} cx={x} cy={y} r="1" fill="#c78f46" />;
                  })}
                </svg>
                <div className="absolute inset-x-6 bottom-5 grid grid-cols-7 text-sm font-medium text-[#a18672]">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Patient Sources</h2>
          <p className="text-[15px] text-[#9a7d67]">Acquisition channels</p>

          <div className="mt-6 flex justify-center">
            <div
              className="h-44 w-44 rounded-full"
              style={{
                background:
                  "conic-gradient(#c78f46 0 38%, #6d9da0 38% 64%, #7fa17b 64% 83%, #cf7e73 83% 94%, #8c79c7 94% 100%)"
              }}
            >
              <div className="m-auto mt-7 h-[120px] w-[120px] rounded-full bg-white" />
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            {sourceBreakdown.map(([label, value, color]) => (
              <li key={label} className="flex items-center justify-between gap-3 text-[15px]">
                <span className="flex items-center gap-3 text-[#5f5145]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
                <span className="font-semibold text-[#2d2723]">{value}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Top Services</h2>
          <p className="text-[15px] text-[#9a7d67]">By revenue · YTD</p>

          <ol className="mt-8 space-y-6">
            {services.map(([label, revenue, appointments, width], index) => (
              <li key={label}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-5 text-sm font-semibold text-[#d1b49c]">
                      {index + 1}
                    </span>
                    <span className="truncate text-[1.05rem] font-medium text-[#2d2723]">
                      {label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[1.05rem] font-semibold text-[#2d2723]">{revenue}</p>
                    <p className="text-sm text-[#9a7d67]">{appointments}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#efe4d7]">
                  <div className="h-2 rounded-full bg-[#c78f46]" style={{ width }} />
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-[32px] bg-white px-6 py-6 shadow-[0_0_0_1px_rgba(147,118,88,0.08)]">
          <h2 className="text-[1.9rem] font-semibold text-[#2d2723]">Top Providers</h2>
          <p className="text-[15px] text-[#9a7d67]">Appointments & revenue · MTD</p>

          <ol className="mt-8 space-y-6">
            {providers.map(([initials, name, role, revenue, appointments, rating], index) => (
              <li key={name} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-5 text-sm font-semibold text-[#d1b49c]">{index + 1}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1e6d7] text-sm font-semibold text-[#ad845a]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[1.05rem] font-medium text-[#2d2723]">{name}</p>
                    <p className="truncate text-sm text-[#9a7d67]">{role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[1.05rem] font-semibold text-[#2d2723]">{revenue}</p>
                  <p className="text-sm text-[#9a7d67]">{appointments}</p>
                  <p className="text-sm font-semibold text-[#c78f46]">★ {rating}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </div>
  );
}
