"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Timer } from "./timer";
import { Celebration } from "./celebration";
import type { Task, MilestoneThreshold, Reinforcement } from "@clarity/types";

interface FocusViewProps {
  goalId: string;
  task: Task;
  position: number;
  totalTasks: number;
  goalProgress: number;
}

export function FocusView({ goalId, task, position, totalTasks, goalProgress }: FocusViewProps) {
  const utils = trpc.useUtils();
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    reinforcement: Reinforcement;
    milestone: MilestoneThreshold | null;
  } | null>(null);

  const completeTask = trpc.task.complete.useMutation({
    onSuccess: (data) => {
      setCelebrationData({
        reinforcement: data.reinforcement,
        milestone: data.milestone,
      });
      setCelebrating(true);
    },
  });

  const softDelete = trpc.task.softDelete.useMutation({
    onSuccess: (result) => {
      utils.task.getNext.invalidate({ goalId });
      toast("Task deleted", {
        action: {
          label: "Undo",
          onClick: () => undoDelete.mutate({ taskId: result.id }),
        },
        duration: 5000,
      });
    },
  });
  const undoDelete = trpc.task.undoDelete.useMutation({
    onSuccess: () => utils.task.getNext.invalidate({ goalId }),
  });

  const handleCelebrationComplete = useCallback(() => {
    setCelebrating(false);
    setCelebrationData(null);
    utils.task.getNext.invalidate({ goalId });
  }, [utils, goalId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      {celebrating && celebrationData && (
        <Celebration
          reinforcement={celebrationData.reinforcement}
          milestone={celebrationData.milestone}
          onComplete={handleCelebrationComplete}
        />
      )}

      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Progress indicator */}
        <div className="text-sm text-[var(--muted)]">
          Task {position} of {totalTasks} · {goalProgress}% complete
        </div>

        {/* Current task */}
        <div className="rounded-xl border-2 border-[var(--accent)] p-8">
          <h2 className="text-xl font-bold">{task.title}</h2>
          {task.description && (
            <p className="mt-3 text-sm text-[var(--muted)]">{task.description}</p>
          )}
          <div className="mt-4 rounded-lg bg-[var(--border)]/30 p-3">
            <p className="text-xs font-medium text-[var(--muted)]">DONE WHEN</p>
            <p className="mt-1 text-sm">{task.doneDefinition}</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <p className="text-xs text-[var(--muted)]">~{task.estimatedMinutes} min</p>
            <Timer running={true} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={() => completeTask.mutate({ id: task.id })}
            disabled={completeTask.isPending}
            className="w-full rounded-xl bg-[var(--success)] py-4 text-lg font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {completeTask.isPending ? "Completing..." : "Mark Complete"}
          </button>
          <button
            onClick={() => softDelete.mutate({ taskId: task.id })}
            disabled={softDelete.isPending}
            className="w-full rounded-xl border border-[var(--border)] py-3 text-sm text-[var(--muted)] hover:text-red-500 hover:border-red-500"
          >
            {softDelete.isPending ? "Deleting..." : "Delete Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
