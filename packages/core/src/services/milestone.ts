import type { MilestoneThreshold } from "@clarity/types";

const THRESHOLDS: MilestoneThreshold[] = ["25", "50", "75", "100"];

// Track last known progress per goal to detect threshold crossings
const lastKnownProgress = new Map<string, number>();

export function checkMilestone(
  goalId: string,
  currentProgress: number,
): MilestoneThreshold | null {
  const previousProgress = lastKnownProgress.get(goalId) ?? 0;
  lastKnownProgress.set(goalId, currentProgress);

  for (const threshold of THRESHOLDS) {
    const t = parseInt(threshold, 10);
    if (previousProgress < t && currentProgress >= t) {
      return threshold;
    }
  }

  return null;
}
