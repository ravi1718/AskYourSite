import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
      <div className="max-w-lg rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-sky-300">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-4 text-slate-300">
          The route you requested does not exist in this first project scaffold.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-sky-400 px-5 py-3 font-semibold text-slate-950"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
