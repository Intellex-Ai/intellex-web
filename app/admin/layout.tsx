import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col gap-6">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Admin console</p>
        <p className="text-3xl font-semibold text-white">Telemetry & Registry</p>
        <p className="text-base text-white/70">Monitor failing domains, tweak the model registry, and keep BYOK traffic healthy.</p>
      </header>

      <nav className="flex flex-wrap gap-3">
        <Link
          href="/admin/sources"
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Source Health
        </Link>
        <Link
          href="/admin/model-sources"
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Model Registry
        </Link>
      </nav>

      {children}
    </main>
  );
}
