"use client";

import Link from "next/link";
import { ProgressBar } from "./progress-bar";
import type { GoalWithCounts } from "@clarity/types";

interface GoalCardProps {
  goal: GoalWithCounts;
}

export function GoalCard({ goal }: GoalCardProps) {
  const progress = goal.taskCount > 0
    ? Math.round((goal.completedTaskCount / goal.taskCount) * 100)
    : 0;

  return (
    <Link
      href={`/goal/${goal.id}`}
      className="block rounded-lg border border-[var(--border)] p-4 hover:border-[var(--accent)]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">{goal.title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{goal.purpose}</p>
        </div>
        {goal.taskCount > 0 && (
          <Link
            href={`/focus/${goal.id}`}
            className="ml-4 rounded bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
            onClick={(e) => e.stopPropagation()}
          >
            Focus
          </Link>
        )}
      </div>
      <div className="mt-3">
        <ProgressBar progress={progress} />
        <p className="mt-1 text-xs text-[var(--muted)]">
          {goal.completedTaskCount}/{goal.taskCount} tasks · {progress}%
        </p>
      </div>
    </Link>
  );
}
