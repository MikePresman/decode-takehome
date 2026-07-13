export function AnalyticsLoadingState() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[30px] bg-[#f6efe5]" />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
        <div className="h-[360px] animate-pulse rounded-[32px] bg-[#f6efe5]" />
        <div className="h-[360px] animate-pulse rounded-[32px] bg-[#f6efe5]" />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[320px] animate-pulse rounded-[32px] bg-[#f6efe5]" />
        ))}
      </section>
    </div>
  );
}
