import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LeadNavLink } from "./components/LeadNavLink";

export const metadata: Metadata = {
  title: "FreelanceOS",
  description: "Lead Tracker CRM + Quick Capture",
};

const navItems = [{ href: "/", label: "Overview" }];

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
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="nav__link">
                  {item.label}
                </Link>
              ))}
              <LeadNavLink />
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
