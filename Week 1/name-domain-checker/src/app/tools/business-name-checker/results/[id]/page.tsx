import Link from "next/link";
import { notFound } from "next/navigation";
import { NameCard } from "@/components/name-checker/name-card";
import { UnlockButton } from "@/components/name-checker/unlock-button";
import { getBestPick, getDomainResultsForName } from "@/lib/report";
import { getReportById } from "@/lib/storage";

type ResultsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const bestPick = getBestPick(report);
  const visibleNames =
    report.paymentStatus === "free" ? report.aiOutput.names.slice(0, 5) : report.aiOutput.names;
  const lockedNames = report.paymentStatus === "free" ? report.aiOutput.names.slice(5) : [];

  return (
    <main className="flex-1 px-4 py-8 sm:py-10">
      <div className="shell space-y-8">
        <section className="panel p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Link className="button-ghost" href="/tools/business-name-checker">
                Back to the tool
              </Link>
              <div>
                <p className="eyebrow">Report summary</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
                  {report.businessIdea}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 muted">
                  Industry: {report.industry} · Tone: {report.tone} · Market: {report.country ?? "Global"}
                </p>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm uppercase tracking-[0.2em] muted">Status</p>
              <p className="mt-2 text-2xl font-semibold">
                {report.paymentStatus === "free" ? "Preview unlocked" : "Full report unlocked"}
              </p>
              <p className="mt-2 text-sm leading-6 muted">
                {report.paymentStatus === "free"
                  ? "You can review the first five names now."
                  : "All names and domain candidates are visible on this page."}
              </p>
            </div>
          </div>
        </section>

        <section className="panel p-6 sm:p-8">
          <p className="eyebrow">Best pick</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{bestPick.name}</h2>
              <p className="mt-2 text-lg muted">{bestPick.tagline}</p>
              <p className="mt-5 text-base leading-7">{bestPick.rationale}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {getDomainResultsForName(bestPick, report.domainResults).map((result) => (
                <a
                  className="rounded-[1.4rem] border border-[var(--border)] bg-white/75 p-4"
                  href={result.purchaseUrl}
                  key={result.domain}
                  rel="noreferrer"
                  target="_blank"
                >
                  <p className="font-medium">{result.domain}</p>
                  <span
                    className={
                      result.status === "available"
                        ? "status-available mt-3"
                        : result.status === "taken"
                          ? "status-taken mt-3"
                          : "status-unknown mt-3"
                    }
                  >
                    {result.status}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {report.paymentStatus === "free" ? (
          <section className="panel p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="eyebrow">Unlock full report</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  See the remaining 15 names and the full domain matrix.
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 muted">
                  Payment is handled through Stripe Checkout. The report unlocks only after the webhook confirms payment on the server.
                </p>
              </div>
              <UnlockButton reportId={report.id} />
            </div>
          </section>
        ) : null}

        <section className="grid gap-5">
          {visibleNames.map((item) => (
            <NameCard
              domainResults={getDomainResultsForName(item, report.domainResults)}
              item={item}
              key={item.name}
            />
          ))}
          {lockedNames.slice(0, 3).map((item) => (
            <NameCard
              domainResults={getDomainResultsForName(item, report.domainResults)}
              item={item}
              key={item.name}
              locked
            />
          ))}
        </section>

        <section className="panel p-6 sm:p-8">
          <p className="text-sm leading-7 muted">
            Domain and business name availability checks are informational only. This tool does not provide trademark, legal, or business registration advice. Always complete your own checks before purchasing or registering a name.
          </p>
        </section>
      </div>
    </main>
  );
}
