export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl w-full animate-pulse">
      <div className="py-6 border-b border-border mb-8">
        <div className="h-9 w-36 rounded-lg bg-white/5 mb-2" />
        <div className="h-4 w-72 rounded bg-white/5" />
      </div>

      {/* Profile skeleton */}
      <div className="rounded-2xl border border-border bg-surface p-6 mb-6">
        <div className="h-5 w-20 rounded bg-white/5 mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-white/5" />
            <div className="h-3 w-44 rounded bg-white/5" />
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <div className="h-3 w-28 rounded bg-white/5 mb-2" />
            <div className="h-10 w-full rounded-lg bg-white/5" />
          </div>
          <div>
            <div className="h-3 w-28 rounded bg-white/5 mb-2" />
            <div className="h-10 w-full rounded-lg bg-white/5" />
          </div>
          <div className="h-10 w-32 rounded-lg bg-white/5" />
        </div>
      </div>

      {/* Account info skeleton */}
      <div className="rounded-2xl border border-border bg-surface p-6 mb-6">
        <div className="h-5 w-20 rounded bg-white/5 mb-6" />
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-border/50">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
          </div>
          <div className="flex justify-between py-3">
            <div className="h-4 w-28 rounded bg-white/5" />
            <div className="h-4 w-24 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Danger zone skeleton */}
      <div className="rounded-2xl border border-ember/20 bg-ember/5 p-6">
        <div className="h-5 w-28 rounded bg-white/5 mb-2" />
        <div className="h-4 w-full rounded bg-white/5 mb-1" />
        <div className="h-4 w-3/4 rounded bg-white/5 mb-5" />
        <div className="h-10 w-36 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}
