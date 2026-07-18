import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LeadNavLink } from "./components/LeadNavLink";

export const metadata: Metadata = {
  title: "FreelanceOS",
  description: "FreelanceOS Consolidated App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="topbar__inner">
            <div className="brand">FreelanceOS</div>
            <nav className="nav" aria-label="Primary">
              <Link href="/" className="nav__link">Overview</Link>
              <LeadNavLink />
              <Link href="/outreach-engine" className="nav__link">Outreach</Link>
              <Link href="/invoice" className="nav__link">Invoice</Link>
              <Link href="/margin-calculator" className="nav__link">Calculator</Link>
              <Link href="/follow-ups" className="nav__link">Follow-Ups</Link>
              <Link href="/brief-builder" className="nav__link">Briefs</Link>
              <Link href="/quote-builder" className="nav__link">Quotes</Link>
              <Link href="/money" className="nav__link">Money</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
