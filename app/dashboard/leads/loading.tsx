export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-white/10 rounded-lg" />
          <div className="h-4 w-36 bg-white/5 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-white/10 rounded-lg" />
      </div>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-8">
          {["Name", "Email", "Phone", "Assistant", "Date"].map((h) => (
            <div key={h} className="h-3 w-16 bg-white/10 rounded" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 px-4 py-3 flex gap-8">
            {[20, 32, 14, 24, 18].map((w, j) => (
              <div key={j} className={`h-3 w-${w} bg-white/5 rounded`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
