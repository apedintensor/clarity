"use client";

import { trpc } from "@/lib/trpc";

interface InboxBadgeProps {
  userId: string;
}

export function InboxBadge({ userId }: InboxBadgeProps) {
  const { data } = trpc.inbox.count.useQuery({ userId });

  if (!data || data.count === 0) return null;

  return (
    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-medium text-white">
      {data.count}
    </span>
  );
}
