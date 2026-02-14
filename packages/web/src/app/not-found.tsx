import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="mb-2 text-2xl font-bold">Page not found</h2>
      <p className="mb-6 text-[var(--muted)]">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white hover:bg-[var(--accent-hover)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
