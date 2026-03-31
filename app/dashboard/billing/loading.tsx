export default function BillingLoading() {
  return (
    <div className="mx-auto max-w-5xl w-full animate-pulse pt-8">
      {/* Centered header */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="h-9 w-60 bg-white/5 rounded-lg" />
        <div className="h-4 w-72 bg-white/5 rounded" />
      </div>

      {/* Status banner */}
      <div className="mb-8 h-16 rounded-2xl border border-border bg-surface" />

      {/* 3 plan cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-7 rounded-3xl border border-border bg-surface flex flex-col gap-4">
            <div className="space-y-2">
              <div className="h-5 w-20 bg-white/5 rounded" />
              <div className="h-4 w-40 bg-white/5 rounded" />
              <div className="h-10 w-24 bg-white/5 rounded mt-2" />
            </div>
            <div className="flex-1 space-y-3 py-2">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="flex gap-3 items-center">
                  <div className="h-4 w-4 bg-white/5 rounded-full shrink-0" />
                  <div className="h-4 bg-white/5 rounded w-full" />
                </div>
              ))}
            </div>
            <div className="h-12 w-full bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
