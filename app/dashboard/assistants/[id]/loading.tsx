export default function AssistantDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl w-full animate-pulse">
      {/* Back + title row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-8 bg-white/5 rounded-lg" />
        <div className="h-7 w-52 bg-white/5 rounded-lg" />
        <div className="h-5 w-16 bg-white/5 rounded ml-2" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border mb-6 pb-px">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-white/5 rounded-t-lg" />
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div className="h-5 w-32 bg-white/5 rounded" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 bg-white/5 rounded" />
              <div className="h-10 w-full bg-white/5 rounded-lg" />
            </div>
          ))}
          <div className="h-10 w-full bg-white/5 rounded-lg mt-2" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4">
          <div className="h-5 w-28 bg-white/5 rounded" />
          <div className="flex-1 min-h-[320px] bg-white/5 rounded-xl" />
          <div className="h-12 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
