import { ExamplePreview } from "@/components/name-checker/example-preview";
import { ToolForm } from "@/components/name-checker/tool-form";

const faqs = [
  {
    question: "What do I get for free?",
    answer:
      "You can generate the report and review the first five name options before deciding whether to unlock the full version.",
  },
  {
    question: "Are the domain checks guaranteed?",
    answer:
      "No. Domain checks are informational only and can return unknown if the provider cannot confirm status.",
  },
  {
    question: "Does this clear trademark risk?",
    answer:
      "No. You still need your own trademark, legal, and business registration checks before you launch.",
  },
];

export default function BusinessNameCheckerPage() {
  return (
    <main className="flex-1 px-4 py-8 sm:py-10">
      <div className="shell space-y-8 sm:space-y-10">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel p-6 sm:p-8">
            <span className="pill">AI Business Name + Domain Checker</span>
            <p className="eyebrow mt-6">Launch-ready naming report</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Get 20 AI-generated business names, domain checks, and stronger launch positioning in under a minute.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 muted">
              Enter your business brief, pick the tone, and review a conversion-focused shortlist. Free users see a limited preview. Paid users unlock the full report and domain grid.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Generated names", value: "20" },
                { label: "Free preview", value: "5" },
                { label: "Unlock price", value: "$9" },
              ].map((item) => (
                <div
                  className="rounded-[1.4rem] border border-[var(--border)] bg-white/70 p-4"
                  key={item.label}
                >
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <ToolForm />
        </section>

        <ExamplePreview />

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-6 sm:p-8">
            <p className="eyebrow">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Paid unlock once, keep the report.
            </h2>
            <div className="mt-6 rounded-[1.6rem] border border-[var(--border)] bg-white/80 p-6">
              <p className="text-4xl font-semibold">$9</p>
              <p className="mt-2 text-base muted">One-off report unlock</p>
              <ul className="mt-6 grid gap-3 text-sm">
                <li>All 20 business names</li>
                <li>Full domain candidate table</li>
                <li>Top 5 recommendation shortlist</li>
                <li>Printable results page</li>
              </ul>
            </div>
          </div>
          <div className="panel p-6 sm:p-8">
            <p className="eyebrow">FAQ</p>
            <div className="mt-5 grid gap-4">
              {faqs.map((faq) => (
                <article
                  className="rounded-[1.4rem] border border-[var(--border)] bg-white/75 p-5"
                  key={faq.question}
                >
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 muted">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
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
