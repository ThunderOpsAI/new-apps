export default function PricingPage() {
  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Pricing</p>
        <h1>Small enough to buy without a meeting</h1>
      </div>
      <div className="pricing-grid">
        <article className="feature-card">
          <h2>Free</h2>
          <p className="lede">Calculator access, invoice preview, and watermarked PDF downloads.</p>
        </article>
        <article className="feature-card">
          <h2>Pro</h2>
          <p className="lede">Unlimited invoices, saved history, clean PDFs, logo/branding path, and invoice email delivery when backend services are configured.</p>
        </article>
      </div>
    </section>
  );
}
