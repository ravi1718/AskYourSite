export default function KnowledgeLoading() {
  return (
    <div className="mx-auto max-w-6xl w-full animate-pulse">
      <div className="py-6 border-b border-border mb-8">
        <div className="h-9 w-52 rounded-lg bg-white/5 mb-2" />
        <div className="h-4 w-96 rounded bg-white/5" />
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-white/5" />
              <div className="h-4 w-32 rounded bg-white/5" />
            </div>
            <div className="h-10 w-16 rounded bg-white/5 mb-2" />
            <div className="h-3 w-40 rounded bg-white/5" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="h-5 w-24 rounded bg-white/5" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-6">
              <div className="h-4 w-48 rounded bg-white/5" />
              <div className="h-5 w-16 rounded bg-white/5" />
              <div className="h-4 w-28 rounded bg-white/5" />
              <div className="h-5 w-16 rounded bg-white/5" />
              <div className="h-4 w-24 rounded bg-white/5 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
