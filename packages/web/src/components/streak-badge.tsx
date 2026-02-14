interface StreakBadgeProps {
  current: number;
  longest: number;
}

export function StreakBadge({ current, longest }: StreakBadgeProps) {
  return (
    <div>
      <p className="text-sm text-[var(--muted)]">Streak</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{current}</span>
        {current > 0 && <span className="text-lg">&#128293;</span>}
      </div>
      <p className="text-xs text-[var(--muted)]">
        Best: {longest} day{longest !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
