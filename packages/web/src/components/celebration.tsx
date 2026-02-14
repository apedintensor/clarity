"use client";

import { useEffect, useState } from "react";
import type { MilestoneThreshold, Reinforcement } from "@clarity/types";

interface CelebrationProps {
  reinforcement: Reinforcement;
  milestone: MilestoneThreshold | null;
  onComplete: () => void;
}

export function Celebration({ reinforcement, milestone, onComplete }: CelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, milestone ? 3000 : 2000);

    return () => clearTimeout(timer);
  }, [milestone, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`rounded-xl p-8 text-center ${
        milestone ? "bg-[var(--celebration)] text-white" : "bg-[var(--bg)] border border-[var(--border)]"
      } animate-bounce shadow-xl`}>
        {milestone && (
          <p className="mb-2 text-4xl">
            {milestone === "100" ? "&#127942;" : milestone === "75" ? "&#127775;" : milestone === "50" ? "&#128170;" : "&#11088;"}
          </p>
        )}
        <p className={`text-lg font-bold ${milestone ? "" : "text-[var(--success)]"}`}>
          {milestone ? `${milestone}% Milestone!` : "Task Complete!"}
        </p>
        <p className={`mt-2 text-sm ${milestone ? "text-white/90" : "text-[var(--muted)]"}`}>
          {reinforcement.message}
        </p>
      </div>
    </div>
  );
}
