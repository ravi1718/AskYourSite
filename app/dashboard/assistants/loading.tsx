export default function AssistantsLoading() {
  return (
    <div className="mx-auto max-w-6xl w-full animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between py-6 border-b border-border mb-8">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-white/5 rounded-lg" />
          <div className="h-4 w-52 bg-white/5 rounded" />
        </div>
        <div className="h-10 w-40 bg-white/5 rounded-lg" />
      </div>

      {/* Grid of assistant cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 bg-white/5 rounded-xl" />
              <div className="h-5 w-16 bg-white/5 rounded-md" />
            </div>
            <div className="h-5 w-36 bg-white/5 rounded mb-2" />
            <div className="h-4 w-48 bg-white/5 rounded mb-4" />
            <div className="h-3 w-28 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
