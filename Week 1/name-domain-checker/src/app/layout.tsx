import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Name Domain Checker",
  description:
    "Generate business names, review domain status, and unlock a launch-ready naming report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
