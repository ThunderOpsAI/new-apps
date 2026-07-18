import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "MarginInvoice",
  description: "Fast invoice generator and profit margin calculator for freelancers and sellers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            MarginInvoice
          </Link>
          <nav>
            <Link href="/invoice">Invoice</Link>
            <Link href="/margin-calculator">Margin calculator</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
        </header>
        <main className="site-shell">{children}</main>
      </body>
    </html>
  );
}
