import type { GoalWithCounts } from "./goal.js";
import type { Task } from "./task.js";

export interface ProgressRecord {
  id: string;
  userId: string;
  date: string;
  tasksCompleted: number;
  goalsAdvanced: number;
  focusMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOutput {
  activeGoals: GoalWithCounts[];
  streak: { current: number; longest: number };
  today: { tasksCompleted: number; focusMinutes: number };
  recentCompletions: Task[];
  weeklyActivity: ProgressRecord[];
}

export interface HistoryInput {
  days?: number;
}

export interface HistoryOutput {
  records: ProgressRecord[];
  totalTasksCompleted: number;
  totalGoalsCompleted: number;
  totalFocusMinutes: number;
  averageTasksPerDay: number;
}
