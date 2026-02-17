"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { OvercommitWarning } from "./overcommit-warning";
import type { UnfinishedTask } from "@clarity/types";

interface DailyPlannerProps {
  planId: string;
  userId: string;
  yesterdayUnfinished: UnfinishedTask[];
  existingSelections: string[];
  focusThresholdMinutes: number;
  status: string;
}

interface SmartPickResult {
  taskId: string;
  reason: string;
}

export function DailyPlanner({
  planId,
  userId,
  yesterdayUnfinished,
  existingSelections,
  focusThresholdMinutes,
  status,
}: DailyPlannerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(existingSelections));
  const [step, setStep] = useState<"review" | "select" | "confirm">(
    yesterdayUnfinished.length > 0 ? "review" : "select",
  );
  const [aiPicks, setAiPicks] = useState<Map<string, string>>(new Map());
  const [isSmartPicking, setIsSmartPicking] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

  const { data: goalsData } = trpc.goal.list.useQuery({ userId, status: "active" });

  // T001 FIX: Do NOT put mutation in useEffect deps. Call mutate directly in toggleTask.
  const updateSelections = trpc.dailyPlan.updateSelections.useMutation();
  const confirmPlan = trpc.dailyPlan.confirm.useMutation({
    onSuccess: () => router.push("/"),
  });
  const skipPlan = trpc.dailyPlan.skip.useMutation({
    onSuccess: () => router.push("/"),
  });
  const scheduleTask = trpc.task.schedule.useMutation();

  useEffect(() => {
    if (status === "confirmed") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "confirmed") {
    return null;
  }

  // T002: Build tasks grouped by goal
  const allTasks = useMemo(() => {
    return (
      goalsData?.items.flatMap((g) =>
        g.tasks
          .filter((t) => !t.deletedAt && t.status !== "completed" && t.status !== "skipped")
          .map((t) => ({ ...t, goalTitle: g.title, goalPurpose: g.purpose, goalProgress: g.progress })),
      ) ?? []
    );
  }, [goalsData]);

  const tasksByGoal = useMemo(() => {
    const grouped = new Map<string, { goalTitle: string; goalProgress: number; tasks: typeof allTasks }>();
    for (const t of allTasks) {
      const key = t.goalId;
      if (!grouped.has(key)) {
        grouped.set(key, { goalTitle: t.goalTitle, goalProgress: t.goalProgress, tasks: [] });
      }
      grouped.get(key)!.tasks.push(t);
    }
    return grouped;
  }, [allTasks]);

  const carryForwardIds = useMemo(() => new Set(yesterdayUnfinished.map((t) => t.id)), [yesterdayUnfinished]);

  // Calculate total minutes locally from selected tasks
  const totalMinutes = useMemo(() => {
    return allTasks
      .filter((t) => selectedIds.has(t.id))
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
  }, [allTasks, selectedIds]);

  // T001 FIX: toggleTask calls mutate directly — no useEffect needed
  const toggleTask = useCallback(
    (taskId: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        // Fire update directly — no feedback loop
        updateSelections.mutate({ planId, selectedTaskIds: Array.from(next) });
        return next;
      });
    },
    [planId, updateSelections],
  );

  // T003/T004: Smart Pick handler
  const handleSmartPick = useCallback(async () => {
    if (allTasks.length === 0) return;
    setIsSmartPicking(true);
    try {
      const payload = {
        tasks: allTasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          estimatedMinutes: t.estimatedMinutes,
          goalTitle: t.goalTitle,
          goalPurpose: t.goalPurpose,
          goalProgress: t.goalProgress,
          isCarryForward: carryForwardIds.has(t.id),
        })),
        focusThresholdMinutes,
      };
      const res = await fetch("/api/smart-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { picks: SmartPickResult[]; message?: string };
      if (data.picks && data.picks.length > 0) {
        const newPicks = new Map<string, string>();
        const newSelected = new Set<string>();
        for (const pick of data.picks) {
          newPicks.set(pick.taskId, pick.reason);
          newSelected.add(pick.taskId);
        }
        setAiPicks(newPicks);
        setSelectedIds(newSelected);
        updateSelections.mutate({ planId, selectedTaskIds: Array.from(newSelected) });
      }
    } catch (err) {
      console.error("Smart pick failed:", err);
    } finally {
      setIsSmartPicking(false);
    }
  }, [allTasks, carryForwardIds, focusThresholdMinutes, planId, updateSelections]);

  // T005: Schedule to Calendar handler
  const handleScheduleToCalendar = useCallback(async () => {
    const selectedTasks = allTasks.filter((t) => selectedIds.has(t.id));
    if (selectedTasks.length === 0) return;

    setIsScheduling(true);
    setScheduleMessage(null);

    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]!;

      // If past 6 PM, schedule for tomorrow at 9 AM
      let startHour: number;
      let startMinute: number;
      let scheduleDate = today;

      if (now.getHours() >= 18) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        scheduleDate = tomorrow.toISOString().split("T")[0]!;
        startHour = 9;
        startMinute = 0;
      } else {
        // Round up to next 30-minute slot
        startHour = now.getHours();
        startMinute = now.getMinutes();
        if (startMinute > 0 && startMinute <= 30) {
          startMinute = 30;
        } else if (startMinute > 30) {
          startMinute = 0;
          startHour += 1;
        }
        // If before 9 AM, start at 9 AM
        if (startHour < 9) {
          startHour = 9;
          startMinute = 0;
        }
      }

      // Sort: shorter tasks first for momentum
      const sorted = [...selectedTasks].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);

      for (const task of sorted) {
        const startStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
        const duration = task.estimatedMinutes;

        await scheduleTask.mutateAsync({
          taskId: task.id,
          scheduledDate: scheduleDate,
          scheduledStart: startStr,
          scheduledDuration: duration,
        });

        // Advance to next slot
        startMinute += duration;
        while (startMinute >= 60) {
          startMinute -= 60;
          startHour += 1;
        }
        // Snap to next 30-min boundary
        if (startMinute > 0 && startMinute < 30) {
          startMinute = 30;
        } else if (startMinute > 30) {
          startMinute = 0;
          startHour += 1;
        }
      }

      setScheduleMessage(`${sorted.length} tasks scheduled to calendar!`);
    } catch (err) {
      console.error("Schedule failed:", err);
      setScheduleMessage("Failed to schedule tasks.");
    } finally {
      setIsScheduling(false);
    }
  }, [allTasks, selectedIds, scheduleTask]);

  const hasNoTasks = allTasks.length === 0;

  return (
    <div className="space-y-6">
      {/* Step: Review yesterday */}
      {step === "review" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Yesterday&apos;s Unfinished Tasks</h2>
          <p className="text-sm text-[var(--muted)]">
            These tasks were scheduled for yesterday but not completed. Select the ones you want to carry forward to today.
          </p>
          {yesterdayUnfinished.map((t) => (
            <label key={t.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 cursor-pointer hover:border-[var(--accent)]">
              <input
                type="checkbox"
                checked={selectedIds.has(t.id)}
                onChange={() => toggleTask(t.id)}
                className="h-4 w-4"
              />
              <div>
                <p className="text-sm">{t.title}</p>
                <p className="text-xs text-[var(--muted)]">{t.goalTitle} · ~{t.estimatedMinutes}min</p>
              </div>
            </label>
          ))}
          <button
            onClick={() => setStep("select")}
            className="w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white"
          >
            Continue to Today&apos;s Plan
          </button>
        </div>
      )}

      {/* Step: Select today's tasks */}
      {step === "select" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Choose which tasks to focus on today. Select tasks that fit within your focus time, then confirm your plan or let AI help you pick.
          </p>

          {/* Smart Pick + Schedule buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSmartPick}
              disabled={isSmartPicking || hasNoTasks}
              className="flex items-center gap-2 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50 transition-colors"
            >
              {isSmartPicking ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                "Smart Pick"
              )}
            </button>
            <button
              onClick={handleScheduleToCalendar}
              disabled={isScheduling || selectedIds.size === 0}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--accent)] disabled:opacity-50 transition-colors"
            >
              {isScheduling ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Scheduling...
                </>
              ) : (
                "Schedule to Calendar"
              )}
            </button>
          </div>

          {scheduleMessage && (
            <p className="text-sm text-green-600 dark:text-green-400">{scheduleMessage}</p>
          )}

          <OvercommitWarning totalMinutes={totalMinutes} thresholdMinutes={focusThresholdMinutes} />

          <div className="text-sm text-[var(--muted)]">
            {selectedIds.size} tasks selected · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min / {Math.floor(focusThresholdMinutes / 60)}h focus
          </div>

          {/* T002: Empty state */}
          {hasNoTasks && (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-center">
              <p className="text-sm text-[var(--muted)]">No tasks available. Create goals and tasks first.</p>
            </div>
          )}

          {/* T002: Tasks grouped by goal */}
          {Array.from(tasksByGoal.entries()).map(([goalId, group]) => (
            <div key={goalId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{group.goalTitle}</h3>
                <span className="text-xs text-[var(--muted)]">{group.goalProgress}% complete</span>
              </div>
              {group.tasks.map((t) => {
                const isAiPick = aiPicks.has(t.id);
                const aiReason = aiPicks.get(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isAiPick
                        ? "border-[var(--accent)] bg-[var(--accent)]/5"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleTask(t.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate">{t.title}</p>
                        {isAiPick && (
                          <span className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-white">
                            AI Pick
                          </span>
                        )}
                        {carryForwardIds.has(t.id) && (
                          <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            Carry Forward
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted)]">~{t.estimatedMinutes}min</p>
                      {isAiPick && aiReason && (
                        <p className="mt-0.5 text-xs text-[var(--accent)] italic">{aiReason}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ))}

          <div className="flex gap-2">
            <button
              onClick={() => confirmPlan.mutate({ planId })}
              disabled={selectedIds.size === 0 || confirmPlan.isPending}
              className="flex-1 rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {confirmPlan.isPending ? "Confirming..." : `Confirm Plan (${selectedIds.size} tasks)`}
            </button>
            <button
              onClick={() => skipPlan.mutate({ planId })}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)]"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
