"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DumpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/inbox");
  }, [router]);

  return (
    <div className="text-[var(--muted)]">Redirecting to Inbox...</div>
  );
}
