export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200 transition-all duration-300 hover:border-sky-400/40 hover:bg-sky-400/15">
      {children}
    </span>
  );
}
