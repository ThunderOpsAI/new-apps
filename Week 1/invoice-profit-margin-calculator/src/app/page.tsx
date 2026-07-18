import Link from "next/link";

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="stack">
          <p className="eyebrow">Invoice + margin micro-SaaS</p>
          <h1>Fast invoice creation and margin math for freelancers and sellers.</h1>
          <p className="lede">
            Price work, protect your margin, preview invoices instantly, and export a professional PDF without dragging yourself into full accounting software.
          </p>
          <div className="cta-row">
            <Link className="primary-button" href="/invoice">
              Create invoice
            </Link>
            <Link className="secondary-button" href="/margin-calculator">
              Calculate margin
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <p className="eyebrow">For freelancers</p>
            <strong>Quote with margin visibility before you send.</strong>
          </div>
          <div className="stat">
            <p className="eyebrow">For ecommerce</p>
            <strong>Include fees, shipping, and tax in one view.</strong>
          </div>
          <div className="stat">
            <p className="eyebrow">No setup</p>
            <strong>No accounting migration. No bloated back office.</strong>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <article className="feature-card">
          <p className="eyebrow">Use cases</p>
          <h2>Freelancers</h2>
          <p className="lede">Check job profit before the client sees the invoice total.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Use cases</p>
          <h2>Dropshippers</h2>
          <p className="lede">Model payment fees, shipping drag, and weak-margin products quickly.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Use cases</p>
          <h2>Service businesses</h2>
          <p className="lede">Turn line items into an invoice and know what the work is actually worth.</p>
        </article>
        <article className="feature-card">
          <p className="eyebrow">Use cases</p>
          <h2>Small ecommerce sellers</h2>
          <p className="lede">Find the rounded sale price that still protects your target margin.</p>
        </article>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Pricing</p>
          <h1>Simple free-to-paid path</h1>
        </div>
        <div className="pricing-grid">
          <article className="feature-card">
            <h2>Free</h2>
            <p className="lede">Basic calculator, live invoice preview, and watermarked PDF export.</p>
          </article>
          <article className="feature-card">
            <h2>Pro</h2>
            <p className="lede">$9/month or a $9 one-off launch deal. Branded PDFs, invoice history, email sending, and unlimited generations.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
