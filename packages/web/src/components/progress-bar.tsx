interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="h-2 w-full rounded-full bg-[var(--border)]">
      <div
        className="h-2 rounded-full bg-[var(--accent)] transition-all duration-500"
        style={{ width: `${Math.max(progress, 2)}%` }}
      />
    </div>
  );
}
