export const GOAL_COLORS = [
  { bg: "#3B82F6", muted: "#3B82F680", name: "Blue" },
  { bg: "#EF4444", muted: "#EF444480", name: "Red" },
  { bg: "#10B981", muted: "#10B98180", name: "Emerald" },
  { bg: "#F59E0B", muted: "#F59E0B80", name: "Amber" },
  { bg: "#8B5CF6", muted: "#8B5CF680", name: "Violet" },
  { bg: "#EC4899", muted: "#EC489980", name: "Pink" },
  { bg: "#06B6D4", muted: "#06B6D480", name: "Cyan" },
  { bg: "#F97316", muted: "#F9731680", name: "Orange" },
  { bg: "#6366F1", muted: "#6366F180", name: "Indigo" },
  { bg: "#14B8A6", muted: "#14B8A680", name: "Teal" },
] as const;

export function getGoalColor(colorIndex: number) {
  return GOAL_COLORS[colorIndex % GOAL_COLORS.length]!;
}
