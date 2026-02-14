export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface Task {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  doneDefinition: string;
  estimatedMinutes: number;
  status: TaskStatus;
  sortOrder: number;
  dependsOn: string[] | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  doneDefinition?: string;
  estimatedMinutes?: number;
  status?: TaskStatus;
  sortOrder?: number;
}

export type MilestoneThreshold = "25" | "50" | "75" | "100";

export type ReinforcementType = "completion" | "milestone" | "streak" | "return";

export interface Reinforcement {
  message: string;
  type: ReinforcementType;
}

export interface TaskCompleteOutput {
  completedTask: Task;
  nextTask: Task | null;
  goalProgress: number;
  milestone: MilestoneThreshold | null;
  reinforcement: Reinforcement;
  streak: {
    current: number;
    longest: number;
    isNewRecord: boolean;
  };
}

export interface GetNextTaskOutput {
  task: Task | null;
  position: number;
  totalTasks: number;
  goalProgress: number;
}
