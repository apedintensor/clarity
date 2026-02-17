"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  use(params);
  const router = useRouter();

  useEffect(() => {
    // Goal detail is now shown via modal on dashboard
    router.replace("/");
  }, [router]);

  return (
    <div className="text-[var(--muted)]">Redirecting to Dashboard...</div>
  );
}
