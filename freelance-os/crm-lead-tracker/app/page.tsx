import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero-card">
        <div className="eyebrow">FreelanceOS Workspace</div>
        <h1 className="page-title">Tools for running your client pipeline.</h1>
        <p className="page-subtitle">
          Phase 1 sets up the Lead Tracker foundation with local persistence,
          quick capture, stats, and filtering.
        </p>
        <div className="row" style={{ marginTop: 24 }}>
          <Link className="button button--primary" href="/leads">
            Open Lead Tracker
          </Link>
        </div>
      </section>
    </main>
  );
}
