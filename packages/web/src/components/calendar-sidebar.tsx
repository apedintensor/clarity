"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getGoalColor } from "@/lib/goal-colors";

interface CalendarSidebarProps {
  userId: string;
}

function isActive(t: { deletedAt?: string | null; status: string; parentTaskId?: string | null }): boolean {
  return !t.deletedAt && t.status !== "skipped" && !t.parentTaskId;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function CalendarSidebar({ userId }: CalendarSidebarProps) {
  const { data: goalsData } = trpc.goal.list.useQuery({ userId, status: "active" });
  const [isDragOver, setIsDragOver] = useState(false);
  const utils = trpc.useUtils();

  const unscheduleMut = trpc.task.unschedule.useMutation({
    onSuccess: () => {
      utils.task.getScheduled.invalidate();
      utils.goal.list.invalidate();
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      unscheduleMut.mutate({ taskId });
    }
  }, [unscheduleMut]);

  if (!goalsData) return <div className="text-sm text-[var(--muted)]">Loading...</div>;

  // Collect unscheduled tasks grouped by goal
  const goalGroups: Array<{
    goalTitle: string;
    colorIndex: number;
    tasks: Array<{
      id: string;
      title: string;
      estimatedMinutes: number;
      status: string;
    }>;
  }> = [];

  let totalUnscheduled = 0;
  let totalEstimatedMins = 0;

  for (const goal of goalsData.items) {
    const unscheduledTasks = goal.tasks.filter(
      (t) => isActive(t) && !t.scheduledDate && t.status !== "completed"
    );
    if (unscheduledTasks.length === 0) continue;

    totalUnscheduled += unscheduledTasks.length;
    totalEstimatedMins += unscheduledTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    goalGroups.push({
      goalTitle: goal.title,
      colorIndex: goal.colorIndex,
      tasks: unscheduledTasks.map((t) => ({
        id: t.id,
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
        status: t.status,
      })),
    });
  }

  return (
    <div
      data-calendar-sidebar
      data-calendar-sidebar-drop
      className={`space-y-3 rounded-lg p-3 transition-colors ${
        isDragOver ? "bg-[var(--accent)]/10 ring-2 ring-[var(--accent)] ring-dashed" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Backlog header */}
      <div>
        <h3 className="text-sm font-semibold">Backlog</h3>
        {totalUnscheduled > 0 && (
          <p className="text-xs text-[var(--muted)]">
            {totalUnscheduled} task{totalUnscheduled !== 1 ? "s" : ""} &middot; {formatDuration(totalEstimatedMins)}
          </p>
        )}
      </div>

      {/* Grouped by goal */}
      {goalGroups.map((group) => {
        const color = getGoalColor(group.colorIndex);
        return (
          <div key={group.goalTitle} className="space-y-1">
            <h4 className="text-[10px] font-medium" style={{ color: color.bg }}>
              # {group.goalTitle}
            </h4>
            {group.tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", task.id);
                  const el = e.currentTarget as HTMLElement;
                  requestAnimationFrame(() => {
                    el.style.opacity = "0.5";
                  });
                }}
                onDragEnd={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
                className="cursor-grab active:cursor-grabbing rounded-lg border px-2.5 py-2 text-xs hover:border-[var(--accent)] transition-colors"
                style={{
                  borderColor: color.bg + "30",
                  borderLeftWidth: "3px",
                  borderLeftColor: color.bg,
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="font-medium leading-tight">{task.title}</p>
                  <span className="shrink-0 rounded bg-[var(--border)] px-1 py-0.5 text-[9px] text-[var(--muted)]">
                    {formatDuration(task.estimatedMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {totalUnscheduled === 0 && (
        <p className="text-xs text-[var(--muted)]">No unscheduled tasks. All tasks are on the board or completed.</p>
      )}

      {isDragOver && (
        <div className="text-center text-xs text-[var(--accent)] py-2 font-medium border-2 border-dashed border-[var(--accent)]/40 rounded-lg">
          Drop here to unschedule
        </div>
      )}
    </div>
  );
}
