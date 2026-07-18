import type { DomainCheckResult, GeneratedName } from "@/lib/types";

type NameCardProps = {
  item: GeneratedName;
  domainResults: DomainCheckResult[];
  locked?: boolean;
};

export function NameCard({ item, domainResults, locked = false }: NameCardProps) {
  return (
    <article className="panel relative overflow-hidden p-5 sm:p-6">
      <div className={locked ? "pointer-events-none blur-[3px]" : ""}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{item.name}</p>
            <p className="mt-1 text-base muted">{item.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="pill">{item.toneFit}</span>
            <span className="pill">{item.bestFor}</span>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-base leading-7">{item.rationale}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {domainResults.map((result) => (
            <a
              className="rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3 text-sm"
              href={result.purchaseUrl}
              key={result.domain}
              rel="noreferrer"
              target="_blank"
            >
              <span className="block font-medium">{result.domain}</span>
              <span
                className={
                  result.status === "available"
                    ? "status-available mt-2"
                    : result.status === "taken"
                      ? "status-taken mt-2"
                      : "status-unknown mt-2"
                }
              >
                {result.status}
              </span>
            </a>
          ))}
        </div>
      </div>

      {locked ? (
        <div className="locked-overlay flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-lg font-semibold">Unlock the remaining 15 names</p>
            <p className="mt-2 text-sm muted">
              The paid report includes every name, all domain candidates, and the top recommendation.
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
