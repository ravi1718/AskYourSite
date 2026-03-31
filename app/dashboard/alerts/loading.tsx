export default function AlertsLoading() {
  return (
    <div className="mx-auto max-w-4xl w-full animate-pulse">
      <div className="flex items-center gap-4 py-6 border-b border-border mb-8">
        <div className="h-8 w-8 rounded-lg bg-white/5" />
        <div className="flex-1">
          <div className="h-8 w-56 rounded-lg bg-white/5 mb-2" />
          <div className="h-4 w-80 rounded bg-white/5" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/5" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-surface">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-32 rounded bg-white/5 mt-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
