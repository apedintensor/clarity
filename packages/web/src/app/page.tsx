"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SortableGoalList } from "@/components/sortable-goal-list";
import { GoalDetailModal } from "@/components/goal-detail-modal";
import { StreakBadge } from "@/components/streak-badge";
import { useCardSelection } from "@/hooks/use-card-selection";

export default function DashboardPage() {
  const { data: dashboard, isLoading } = trpc.progress.dashboard.useQuery();
  const utils = trpc.useUtils();
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);

  // Ensure user exists
  trpc.user.getOrCreate.useQuery();

  const softDeleteMut = trpc.goal.softDelete.useMutation({
    onSuccess: () => handleUpdate(),
  });
  const undoDeleteMut = trpc.goal.undoDelete.useMutation({
    onSuccess: () => handleUpdate(),
  });
  const permanentDeleteMut = trpc.goal.permanentDelete.useMutation({
    onSuccess: () => handleUpdate(),
  });

  const { selectedId, select } = useCardSelection({
    onDelete: (id) => {
      softDeleteMut.mutate({ id }, {
        onSuccess: (data) => {
          const timeout = setTimeout(() => {
            permanentDeleteMut.mutate({ id });
          }, 5000);
          toast("Goal deleted", {
            action: {
              label: "Undo",
              onClick: () => {
                clearTimeout(timeout);
                undoDeleteMut.mutate({ id, cascadeDeletedTaskIds: data.cascadeDeletedTaskIds });
              },
            },
            duration: 5000,
          });
        },
      });
    },
  });

  const handleUpdate = () => {
    utils.progress.dashboard.invalidate();
    utils.goal.list.invalidate();
  };

  if (isLoading) {
    return <div className="text-[var(--muted)]">Loading dashboard...</div>;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/inbox"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Inbox
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--border)] p-4">
          <StreakBadge current={dashboard.streak.current} longest={dashboard.streak.longest} />
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted)]">Today</p>
          <p className="text-2xl font-bold">{dashboard.today.tasksCompleted}</p>
          <p className="text-xs text-[var(--muted)]">tasks completed</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted)]">Focus Time</p>
          <p className="text-2xl font-bold">{dashboard.today.focusMinutes}</p>
          <p className="text-xs text-[var(--muted)]">minutes today</p>
        </div>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Active Goals</h2>
        {dashboard.activeGoals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            <p>No active goals yet.</p>
            <p className="mt-1 text-sm">Start by capturing a thought in the Inbox!</p>
          </div>
        ) : (
          <SortableGoalList
            goals={dashboard.activeGoals}
            selectedId={selectedId}
            onSelect={select}
            onOpenDetail={(id) => setDetailGoalId(id)}
            onUpdate={handleUpdate}
          />
        )}
      </div>

      {/* Recent Completions */}
      {dashboard.recentCompletions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Recent Completions</h2>
          <ul className="space-y-2">
            {dashboard.recentCompletions.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <span className="text-[var(--success)]">&#10003;</span>
                <span>{task.title}</span>
                <span className="text-xs text-[var(--muted)]">
                  {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weekly Activity */}
      {dashboard.weeklyActivity.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">This Week</h2>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0]!;
              const record = dashboard.weeklyActivity.find((r) => r.date === date);
              const count = record?.tasksCompleted ?? 0;
              const intensity = count === 0 ? "bg-[var(--border)]" : count < 3 ? "bg-[var(--success)]/40" : "bg-[var(--success)]";
              return (
                <div
                  key={date}
                  className={`h-8 flex-1 rounded ${intensity}`}
                  title={`${date}: ${count} tasks`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {detailGoalId && (
        <GoalDetailModal
          goalId={detailGoalId}
          onClose={() => setDetailGoalId(null)}
        />
      )}
    </div>
  );
}
