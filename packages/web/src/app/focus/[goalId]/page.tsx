"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { FocusView } from "@/components/focus-view";

export default function FocusPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = use(params);

  const { data, isLoading } = trpc.task.getNext.useQuery({ goalId });
  const { data: goal } = trpc.goal.get.useQuery({ id: goalId });

  if (isLoading) return <div className="text-[var(--muted)]">Loading focus mode...</div>;

  if (!data?.task) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-4xl">&#127942;</p>
        <h2 className="mt-4 text-2xl font-bold">All tasks complete!</h2>
        <p className="mt-2 text-[var(--muted)]">
          {goal ? `"${goal.title}" is done. Amazing work!` : "Great job!"}
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/goal/${goalId}`} className="text-sm text-[var(--muted)] hover:text-[var(--fg)]">
          &larr; Exit Focus Mode
        </Link>
        <p className="text-sm font-medium text-[var(--muted)]">{goal?.title}</p>
      </div>
      <FocusView
        goalId={goalId}
        task={data.task}
        position={data.position}
        totalTasks={data.totalTasks}
        goalProgress={data.goalProgress}
      />
    </div>
  );
}
