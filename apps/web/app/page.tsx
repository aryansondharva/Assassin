export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-red-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-lg font-black uppercase tracking-widest">Tech Assassin</span>
          </div>
          <nav className="hidden gap-6 md:flex text-sm font-semibold text-neutral-400">
            <a href="#missions" className="transition hover:text-white">Missions</a>
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </nav>
          <div>
            <span className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold text-neutral-300">
              v2.0 Beta
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-24 md:py-32">
          {/* Radial Gradient Background */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.12),transparent_50%)]" />
          
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
              THE ULTIMATE PLATFORM FOR ELITE DEVELOPERS
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
              Tech Assassin is a high-performance workspace combining structured learning missions, peer-reviewed proof, community developer squads, and robust backend engineering.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="https://github.com/assassinbuilds/Assassin"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-red-600 px-6 py-3 text-sm font-bold shadow-lg shadow-red-600/30 transition hover:bg-red-500 hover:shadow-red-600/50"
              >
                Explore Repository
              </a>
              <span className="text-sm font-semibold text-neutral-300">
                Next.js App Router &bull; Prisma &bull; Upstash Redis
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="missions" className="border-t border-white/5 bg-neutral-950 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl border border-white/5 bg-black/45 p-8 transition hover:border-red-600/30">
                <span className="text-xs font-black uppercase tracking-wider text-red-500">Structured</span>
                <h3 className="mt-4 text-xl font-bold">Missions Control</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Replace learning paralysis with daily actionable objectives, verified proof requirements, and clear deliverables.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-white/5 bg-black/45 p-8 transition hover:border-red-600/30">
                <span className="text-xs font-black uppercase tracking-wider text-red-500">Accountability</span>
                <h3 className="mt-4 text-xl font-bold">Developer Squads</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Participate in peer-review cycles, code evaluations, and feedback loops to build production-grade code.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-white/5 bg-black/45 p-8 transition hover:border-red-600/30">
                <span className="text-xs font-black uppercase tracking-wider text-red-500">Security</span>
                <h3 className="mt-4 text-xl font-bold">Cryptographic Shielding</h3>
                <p className="mt-2 text-sm text-neutral-400">
                  Secured with Scrypt key-derivation hashing, Constant-Time equality comparison against timing attacks, and strict CSP policies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-widest text-red-600">Production Ready</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">System Architecture</h2>
              <p className="mt-4 text-neutral-400 leading-7">
                Our database runs on Neon Postgres via Prisma ORM for data integrity, paired with Upstash Redis for high-speed rate-limiting and session caching. Asset storage is managed via Cloudflare R2 secure object pools.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-xs text-neutral-600">
        <p>&copy; {new Date().getFullYear()} Tech Assassin. All rights reserved.</p>
      </footer>
    </div>
  )
}
