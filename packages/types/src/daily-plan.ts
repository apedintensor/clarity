export type DailyPlanStatus = "in_progress" | "confirmed" | "skipped";

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  selectedTaskIds: string[];
  totalEstimatedMinutes: number;
  focusThresholdMinutes: number;
  isOvercommitted: boolean;
  status: DailyPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UnfinishedTask {
  id: string;
  title: string;
  goalTitle: string;
  estimatedMinutes: number;
}

export interface StartDailyPlanOutput {
  id: string;
  date: string;
  yesterdayUnfinished: UnfinishedTask[];
  existingSelections: string[];
  focusThresholdMinutes: number;
  status: DailyPlanStatus;
}

export interface UpdateSelectionsOutput {
  totalEstimatedMinutes: number;
  isOvercommitted: boolean;
  overcommittedByMinutes: number;
}

export interface ConfirmPlanOutput {
  confirmedTaskCount: number;
  totalEstimatedMinutes: number;
}
