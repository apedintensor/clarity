"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Modal } from "./modal";
import { ProgressBar } from "./progress-bar";
import { SortableTaskList } from "./sortable-task-list";

interface GoalDetailModalProps {
  goalId: string;
  onClose: () => void;
}

export function GoalDetailModal({ goalId, onClose }: GoalDetailModalProps) {
  const utils = trpc.useUtils();

  const { data: goal, isLoading } = trpc.goal.get.useQuery({ id: goalId });

  const breakdownGoal = trpc.goal.breakdown.useMutation({
    onSuccess: () => utils.goal.get.invalidate({ id: goalId }),
  });

  const updateGoal = trpc.goal.update.useMutation({
    onSuccess: () => {
      utils.goal.get.invalidate({ id: goalId });
      utils.goal.list.invalidate();
    },
  });

  if (isLoading) {
    return (
      <Modal onClose={onClose}>
        <div className="text-[var(--muted)]">Loading...</div>
      </Modal>
    );
  }

  if (!goal) {
    return (
      <Modal onClose={onClose}>
        <div className="text-red-500">Goal not found</div>
      </Modal>
    );
  }

  const activeTasks = goal.tasks.filter((t) => !t.deletedAt);
  const completedCount = activeTasks.filter((t) => t.status === "completed").length;
  const progress = activeTasks.length > 0 ? Math.round((completedCount / activeTasks.length) * 100) : 0;

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-start justify-between pr-8">
          <div>
            <h2 className="text-xl font-bold">{goal.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{goal.purpose}</p>
            {goal.description && (
              <p className="mt-2 text-sm">{goal.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {activeTasks.length > 0 && (
            <Link
              href={`/focus/${goal.id}`}
              onClick={onClose}
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

        {/* Progress */}
        <div>
          <ProgressBar progress={progress} />
          <p className="mt-1 text-sm text-[var(--muted)]">
            {completedCount}/{activeTasks.length} tasks · {progress}% complete
          </p>
        </div>

        {/* Tasks */}
        {activeTasks.length === 0 && goal.tasks.length === 0 ? (
          <button
            onClick={() => breakdownGoal.mutate({ id: goal.id })}
            disabled={breakdownGoal.isPending}
            className="w-full rounded-lg bg-[var(--accent)] py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {breakdownGoal.isPending ? "Breaking down with AI..." : "Break Down into Tasks"}
          </button>
        ) : (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <SortableTaskList
              tasks={activeTasks}
              goalId={goal.id}
              onUpdate={() => {
                utils.goal.get.invalidate({ id: goalId });
                utils.goal.list.invalidate();
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
