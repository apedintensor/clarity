"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { getGoalColor } from "@/lib/goal-colors";
import { ContextMenu } from "./context-menu";
import type { ContextMenuItem } from "./context-menu";
import { CalendarTaskEditModal } from "./calendar-task-edit-modal";

interface CalendarViewProps {
  userId: string;
}

interface DragData {
  taskId: string;
  sourceDate: string | null;
}

interface CardContextMenu {
  x: number;
  y: number;
  taskId: string;
  taskTitle: string;
  status: string;
}

interface FocusState {
  taskId: string;
  taskTitle: string;
  plannedMinutes: number;
  startedAt: number; // Date.now()
}

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day + weekOffset * 7);
  sunday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// --- Focus Mode Overlay ---
function FocusModeOverlay({
  focus,
  onStop,
  onComplete,
}: {
  focus: FocusState;
  onStop: () => void;
  onComplete: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(Math.floor((Date.now() - focus.startedAt) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [focus.startedAt]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-xl space-y-8 text-center px-6">
        {/* Completion circle + Title */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onComplete}
            className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[var(--muted)] hover:border-green-500 flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" className="text-[var(--muted)]">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--fg)]">
            {focus.taskTitle}
          </h1>
        </div>

        {/* Timer row */}
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Actual</div>
            <div className="text-4xl font-mono font-semibold text-green-400 tabular-nums">
              {formatTimer(elapsed)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)] mb-1">Planned</div>
            <div className="text-4xl font-mono font-semibold text-[var(--muted)] tabular-nums">
              {formatDuration(focus.plannedMinutes)}
            </div>
          </div>
          <button
            onClick={onStop}
            className="ml-2 flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--fg)] hover:bg-[var(--border)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="10" rx="1" />
              <rect x="7" y="1" width="4" height="10" rx="1" />
            </svg>
            STOP
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main CalendarView ---
export function CalendarView({ userId }: CalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [cardContextMenu, setCardContextMenu] = useState<CardContextMenu | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [focusState, setFocusState] = useState<FocusState | null>(null);
  const dragDataRef = useRef<DragData | null>(null);

  const utils = trpc.useUtils();

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const startDate = formatDate(weekDays[0]!);
  const endDate = formatDate(weekDays[6]!);
  const todayStr = formatDate(new Date());

  const { data: scheduled } = trpc.task.getScheduled.useQuery({ userId, startDate, endDate });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      utils.task.getScheduled.invalidate();
      utils.goal.list.invalidate();
    },
  });

  const completeMutation = trpc.task.complete.useMutation({
    onSuccess: () => {
      utils.task.getScheduled.invalidate();
      utils.goal.list.invalidate();
    },
  });

  const unscheduleMut = trpc.task.unschedule.useMutation({
    onSuccess: () => {
      utils.task.getScheduled.invalidate();
      utils.goal.list.invalidate();
    },
  });

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof scheduled>();
    if (!scheduled) return map;
    for (const task of scheduled) {
      if (!task.scheduledDate) continue;
      const existing = map.get(task.scheduledDate) ?? [];
      existing.push(task);
      map.set(task.scheduledDate, existing);
    }
    return map;
  }, [scheduled]);

  // Week header
  const weekLabel = useMemo(() => {
    const first = weekDays[0]!;
    const last = weekDays[6]!;
    if (first.getMonth() === last.getMonth()) {
      return `${MONTH_NAMES[first.getMonth()]} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
    }
    return `${MONTH_NAMES[first.getMonth()]} ${first.getDate()} – ${MONTH_NAMES[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
  }, [weekDays]);

  // DnD handlers
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string, sourceDate: string | null) => {
    dragDataRef.current = { taskId, sourceDate };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    const el = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => el.style.opacity = "0.5");
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    dragDataRef.current = null;
    setDragOverDate(null);
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  }, []);

  const handleColumnDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleColumnDrop = useCallback((e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);

    const data = dragDataRef.current;
    const taskId = data?.taskId ?? e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    if (data?.sourceDate === targetDate) return;

    updateMutation.mutate({
      id: taskId,
      scheduledDate: targetDate,
      scheduledStart: null,
    });
    dragDataRef.current = null;
  }, [updateMutation]);

  // Task card actions
  const handleToggleComplete = useCallback((taskId: string, currentStatus: string) => {
    if (currentStatus === "completed") {
      updateMutation.mutate({ id: taskId, status: "pending" });
    } else {
      completeMutation.mutate({ id: taskId });
    }
  }, [updateMutation, completeMutation]);

  const handleCardDoubleClick = useCallback((taskId: string) => {
    setEditingTaskId(taskId);
  }, []);

  const handleCardContextMenu = useCallback((e: React.MouseEvent, taskId: string, taskTitle: string, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCardContextMenu({ x: e.clientX, y: e.clientY, taskId, taskTitle, status });
  }, []);

  const handleContextAction = useCallback((action: string) => {
    if (!cardContextMenu) return;
    const { taskId, status } = cardContextMenu;

    if (action === "edit") {
      setEditingTaskId(taskId);
    } else if (action === "complete") {
      if (status === "completed") {
        updateMutation.mutate({ id: taskId, status: "pending" });
      } else {
        completeMutation.mutate({ id: taskId });
      }
    } else if (action === "reschedule") {
      setEditingTaskId(taskId);
    } else if (action === "remove") {
      unscheduleMut.mutate({ taskId });
    }
    setCardContextMenu(null);
  }, [cardContextMenu, updateMutation, completeMutation, unscheduleMut]);

  // Focus mode
  const handleStartFocus = useCallback((taskId: string, taskTitle: string, plannedMinutes: number) => {
    setFocusState({ taskId, taskTitle, plannedMinutes, startedAt: Date.now() });
  }, []);

  const handleStopFocus = useCallback(() => {
    setFocusState(null);
  }, []);

  const handleFocusComplete = useCallback(() => {
    if (!focusState) return;
    completeMutation.mutate({ id: focusState.taskId });
    setFocusState(null);
  }, [focusState, completeMutation]);

  const contextMenuItems: ContextMenuItem[] = cardContextMenu
    ? [
        { label: "Edit", onClick: () => handleContextAction("edit") },
        { label: cardContextMenu.status === "completed" ? "Mark Pending" : "Complete", onClick: () => handleContextAction("complete") },
        { label: "Reschedule", onClick: () => handleContextAction("reschedule") },
        { label: "Remove from Calendar", onClick: () => handleContextAction("remove") },
      ]
    : [];

  // Focus mode overlay
  if (focusState) {
    return (
      <FocusModeOverlay
        focus={focusState}
        onStop={handleStopFocus}
        onComplete={handleFocusComplete}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded border border-[var(--border)] px-2.5 py-1 text-sm hover:bg-[var(--border)] transition-colors"
          >
            &larr;
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--border)] transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded border border-[var(--border)] px-2.5 py-1 text-sm hover:bg-[var(--border)] transition-colors"
          >
            &rarr;
          </button>
        </div>
        <h2 className="text-base font-semibold text-[var(--fg)]">{weekLabel}</h2>
      </div>

      {/* Kanban board */}
      <div className="flex gap-1.5 flex-1 overflow-x-auto pb-1">
        {weekDays.map((day) => {
          const dateStr = formatDate(day);
          const isToday = dateStr === todayStr;
          const dayTasks = tasksByDate.get(dateStr) ?? [];
          const completedCount = dayTasks.filter((t) => t.status === "completed").length;
          const totalCount = dayTasks.length;
          const isDragOver = dragOverDate === dateStr;

          return (
            <div
              key={dateStr}
              className={`flex flex-col flex-1 min-w-[140px] rounded-lg border transition-colors ${
                isToday
                  ? "border-[var(--accent)]/60 bg-[var(--accent)]/5"
                  : isDragOver
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                    : "border-[var(--border)]/60"
              }`}
              onDragOver={(e) => handleColumnDragOver(e, dateStr)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, dateStr)}
            >
              {/* Column header */}
              <div className={`px-2.5 py-2 border-b ${isToday ? "border-[var(--accent)]/20" : "border-[var(--border)]/40"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[11px] font-medium ${isToday ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                      {SHORT_DAY_NAMES[day.getDay()]}
                    </span>
                    <span className={`text-sm font-semibold ${isToday ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}>
                      {day.getDate()}
                    </span>
                  </div>
                  {isToday && (
                    <span className="text-[9px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">
                      TODAY
                    </span>
                  )}
                </div>

                {/* Progress bar for today */}
                {isToday && totalCount > 0 && (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-0.5">
                      <span>{completedCount}/{totalCount}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--border)]/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all"
                        style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Task cards */}
              <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto min-h-[80px]">
                {dayTasks.map((task) => {
                  const color = getGoalColor(task.goalColorIndex);
                  const isCompleted = task.status === "completed";
                  const duration = task.scheduledDuration ?? task.estimatedMinutes ?? 30;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, dateStr)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => handleCardDoubleClick(task.id)}
                      onContextMenu={(e) => handleCardContextMenu(e, task.id, task.title, task.status)}
                      className={`group cursor-grab active:cursor-grabbing rounded-lg border px-2.5 py-2 text-xs transition-all hover:shadow-sm ${
                        isCompleted ? "opacity-50" : ""
                      }`}
                      style={{
                        borderColor: color.muted,
                        borderLeftWidth: "3px",
                        borderLeftColor: color.bg,
                        backgroundColor: color.bg + "08",
                      }}
                    >
                      {/* Title */}
                      <p className={`font-medium text-[var(--fg)] leading-snug ${isCompleted ? "line-through text-[var(--muted)]" : ""}`}>
                        {task.title}
                      </p>

                      {/* Goal tag + duration */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                          style={{
                            backgroundColor: color.bg + "20",
                            color: color.bg,
                          }}
                        >
                          {task.goalTitle}
                        </span>
                        <span className="rounded-full bg-[var(--border)]/60 px-1.5 py-0.5 text-[9px] text-[var(--muted)] tabular-nums">
                          {formatDuration(duration)}
                        </span>
                      </div>

                      {/* Bottom row: checkbox + start */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--border)]/30">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(task.id, task.status);
                          }}
                          className={`flex items-center gap-1 text-[10px] transition-colors ${
                            isCompleted
                              ? "text-green-500"
                              : "text-[var(--muted)] hover:text-[var(--fg)]"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-colors ${
                              isCompleted
                                ? "bg-green-500 border-green-500"
                                : "border-[var(--muted)] hover:border-[var(--accent)]"
                            }`}
                          >
                            {isCompleted && (
                              <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          {isCompleted ? "Done" : "Complete"}
                        </button>

                        {!isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartFocus(task.id, task.title, duration);
                            }}
                            className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent)]/80 font-medium transition-colors"
                          >
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                              <path d="M3 1.5v9l7.5-4.5L3 1.5z" />
                            </svg>
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {dayTasks.length === 0 && !isDragOver && (
                  <div className="text-[10px] text-[var(--muted)] text-center py-6 opacity-60">
                    No tasks
                  </div>
                )}

                {isDragOver && (
                  <div className="border-2 border-dashed border-[var(--accent)]/30 rounded-lg py-3 text-center text-[10px] text-[var(--accent)]">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {cardContextMenu && (
        <ContextMenu
          x={cardContextMenu.x}
          y={cardContextMenu.y}
          items={contextMenuItems}
          onClose={() => setCardContextMenu(null)}
        />
      )}

      {/* Edit modal */}
      {editingTaskId && (
        <CalendarTaskEditModal
          taskId={editingTaskId}
          onClose={() => setEditingTaskId(null)}
          onUpdate={() => {
            utils.task.getScheduled.invalidate();
            utils.goal.list.invalidate();
            setEditingTaskId(null);
          }}
        />
      )}
    </div>
  );
}
