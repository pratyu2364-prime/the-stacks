/** Shown instead of an auth form when the bundle has no Supabase project. */
export function NotConfigured() {
  return (
    <main className="min-h-screen grid place-items-center px-6 text-center">
      <div className="max-w-md border border-oak/60 rounded-lg p-8 bg-black/30">
        <h1 className="font-serif text-2xl mb-3">The library is not open yet</h1>
        <p className="text-dust text-sm leading-relaxed">
          This build has no database behind it, so accounts cannot be made. The demo
          library still works — nothing there needs an account.
        </p>
        <a href="library" className="inline-block mt-6 text-xs uppercase tracking-widest text-lamp hover:underline">
          walk the demo library →
        </a>
      </div>
    </main>
  );
}
