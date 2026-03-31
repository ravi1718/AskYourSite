export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl w-full animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between py-6 border-b border-border mb-8">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/5 rounded-lg" />
          <div className="h-4 w-44 bg-white/5 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-white/5 rounded-lg" />
          <div className="h-10 w-36 bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* Usage banner */}
      <div className="mb-8 h-20 rounded-2xl border border-border bg-surface" />

      {/* 3 stat cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 bg-white/5 rounded-lg" />
              <div className="h-4 w-28 bg-white/5 rounded" />
            </div>
            <div className="h-9 w-20 bg-white/5 rounded mb-2" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Two-column detail section */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="p-6 rounded-2xl border border-border bg-surface">
          <div className="h-6 w-44 bg-white/5 rounded mb-6" />
          <div className="space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-52 bg-white/5 rounded" />
                  <div className="h-4 w-14 bg-white/5 rounded" />
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-surface">
          <div className="h-6 w-32 bg-white/5 rounded mb-6" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
