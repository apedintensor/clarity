"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { ProgressBar } from "@/components/progress-bar";
import { TaskItem } from "@/components/task-item";

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const utils = trpc.useUtils();

  const { data: goal, isLoading } = trpc.goal.get.useQuery({ id });

  const breakdownGoal = trpc.goal.breakdown.useMutation({
    onSuccess: () => utils.goal.get.invalidate({ id }),
  });

  const updateGoal = trpc.goal.update.useMutation({
    onSuccess: () => utils.goal.get.invalidate({ id }),
  });

  if (isLoading) return <div className="text-[var(--muted)]">Loading...</div>;
  if (!goal) return <div className="text-red-500">Goal not found</div>;

  const completedCount = goal.tasks.filter((t) => t.status === "completed").length;
  const progress = goal.tasks.length > 0 ? Math.round((completedCount / goal.tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{goal.purpose}</p>
        </div>
        <div className="flex gap-2">
          {goal.tasks.length > 0 && (
            <Link
              href={`/focus/${goal.id}`}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Focus Mode
            </Link>
          )}
          {goal.status === "active" && (
            <button
              onClick={() => updateGoal.mutate({ id: goal.id, status: "archived" })}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div>
        <ProgressBar progress={progress} />
        <p className="mt-1 text-sm text-[var(--muted)]">
          {completedCount}/{goal.tasks.length} tasks · {progress}% complete
        </p>
      </div>

      {/* Task Breakdown */}
      {goal.tasks.length === 0 ? (
        <button
          onClick={() => breakdownGoal.mutate({ id: goal.id })}
          disabled={breakdownGoal.isPending}
          className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {breakdownGoal.isPending ? "Breaking down with AI..." : "Break Down into Tasks"}
        </button>
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Tasks</h2>
          {goal.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={() => utils.goal.get.invalidate({ id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
