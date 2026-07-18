import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1 px-4 py-12 sm:py-16">
      <div className="shell">
        <section className="panel overflow-hidden px-6 py-10 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <span className="pill">Week 1 MVP</span>
              <div className="space-y-4">
                <p className="eyebrow">Naming tool</p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
                  Generate business names and check domains in one click.
                </h1>
                <p className="max-w-2xl text-lg leading-8 muted">
                  Build a shortlist fast. The tool generates 20 names, suggests
                  taglines, and maps the likely domain paths before you spend time
                  on branding.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="button-primary"
                  href="/tools/business-name-checker"
                >
                  Open the tool
                </Link>
                <a className="button-secondary" href="#what-you-get">
                  See the report
                </a>
              </div>
            </div>
            <div className="panel bg-[rgba(255,255,255,0.55)] p-6">
              <p className="eyebrow">What you get</p>
              <div
                className="mt-5 grid gap-4 text-sm sm:grid-cols-2"
                id="what-you-get"
              >
                {[
                  "20 AI-generated business names",
                  "Taglines and rationale for each option",
                  "Top recommendation with strongest fit",
                  "Domain checks across common launch extensions",
                  "Locked free preview and Stripe unlock flow",
                  "Printable results page for handoff and review",
                ].map((item) => (
                  <div
                    className="rounded-2xl border border-[var(--border)] bg-white/70 p-4"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
