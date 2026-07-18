const previewRows = [
  {
    name: "NorthForge",
    tagline: "Build a stronger first brand impression.",
    status: "Available",
  },
  {
    name: "BrightNest",
    tagline: "Simple names with room to grow.",
    status: "Taken",
  },
  {
    name: "LaunchLane",
    tagline: "Made for fast-moving new businesses.",
    status: "Unknown",
  },
];

export function ExamplePreview() {
  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Example output</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            The report is built to help you choose, not just brainstorm.
          </h2>
        </div>
        <p className="max-w-xl text-base leading-7 muted">
          Each name includes positioning guidance, tagline direction, and domain
          candidates. Free users see a preview first. Paid users unlock the full set.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {previewRows.map((item) => (
          <article
            className="rounded-[1.4rem] border border-[var(--border)] bg-white/75 p-5"
            key={item.name}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p className="mt-1 muted">{item.tagline}</p>
              </div>
              <span
                className={`${
                  item.status === "Available"
                    ? "status-available"
                    : item.status === "Taken"
                      ? "status-taken"
                      : "status-unknown"
                }`}
              >
                {item.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
