"use client";

import { trpc } from "@/lib/trpc";
import { DailyPlanner } from "@/components/daily-planner";

export default function PlanPage() {
  const { data: user } = trpc.user.getOrCreate.useQuery();
  const userId = user?.id ?? "";

  const startPlan = trpc.dailyPlan.start.useMutation();

  const { data: todayPlan } = trpc.dailyPlan.getToday.useQuery(
    { userId },
    { enabled: !!userId },
  );

  if (!userId) return <div className="text-[var(--muted)]">Loading...</div>;

  // If no plan started yet, show start button
  if (!todayPlan && !startPlan.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Plan Your Day</h1>
        <p className="text-[var(--muted)]">
          Daily planning helps you decide which tasks to focus on today. Pick the tasks that matter most, then confirm your plan to stay focused and avoid decision fatigue throughout the day.
        </p>
        <button
          onClick={() => startPlan.mutate({ userId })}
          disabled={startPlan.isPending}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white"
        >
          {startPlan.isPending ? "Starting..." : "Start Planning"}
        </button>
      </div>
    );
  }

  const plan = startPlan.data ?? (todayPlan ? {
    id: todayPlan.id,
    date: todayPlan.date,
    yesterdayUnfinished: [],
    existingSelections: todayPlan.selectedTaskIds as string[],
    focusThresholdMinutes: todayPlan.focusThresholdMinutes,
    status: todayPlan.status as "in_progress" | "confirmed" | "skipped",
  } : null);

  if (!plan) return <div className="text-[var(--muted)]">Loading plan...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Plan Your Day</h1>
      <DailyPlanner
        planId={plan.id}
        userId={userId}
        yesterdayUnfinished={plan.yesterdayUnfinished}
        existingSelections={plan.existingSelections}
        focusThresholdMinutes={plan.focusThresholdMinutes}
        status={plan.status}
      />
    </div>
  );
}
