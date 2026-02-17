"use client";

interface OvercommitWarningProps {
  totalMinutes: number;
  thresholdMinutes: number;
}

export function OvercommitWarning({ totalMinutes, thresholdMinutes }: OvercommitWarningProps) {
  if (totalMinutes <= thresholdMinutes) return null;

  const overBy = totalMinutes - thresholdMinutes;
  const overHours = Math.floor(overBy / 60);
  const overMins = overBy % 60;

  return (
    <div className="rounded-lg border border-amber-500 bg-amber-50 p-3 dark:bg-amber-950/20">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        ⚠ Overcommitted by {overHours > 0 ? `${overHours}h ` : ""}{overMins > 0 ? `${overMins}min` : ""}
      </p>
      <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
        You have {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min planned against a {Math.floor(thresholdMinutes / 60)}h focus threshold.
        Consider deferring some tasks to another day.
      </p>
    </div>
  );
}
