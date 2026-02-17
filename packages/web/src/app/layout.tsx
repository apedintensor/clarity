import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/lib/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "sonner";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Clarity — Braindump to Action",
  description: "Transform your thoughts into actionable steps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <nav className="border-b border-[var(--border)] px-6 py-4">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <Link href="/" className="text-xl font-bold text-[var(--accent)]">
                Clarity
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/" className="text-[var(--muted)] hover:text-[var(--fg)]">
                  Dashboard
                </Link>
                <Link href="/inbox" className="text-[var(--muted)] hover:text-[var(--fg)]">
                  Inbox
                </Link>
                <Link href="/calendar" className="text-[var(--muted)] hover:text-[var(--fg)]">
                  Calendar
                </Link>
                <Link href="/plan" className="text-[var(--muted)] hover:text-[var(--fg)]">
                  Plan
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </nav>
          <main className="mx-auto max-w-4xl px-6 py-8">
            {children}
          </main>
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
