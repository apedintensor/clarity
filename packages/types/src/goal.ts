export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  userId: string;
  brainDumpId: string;
  title: string;
  purpose: string;
  description: string | null;
  status: GoalStatus;
  progress: number;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithCounts extends Goal {
  taskCount: number;
  completedTaskCount: number;
}

export interface CreateGoalInput {
  brainDumpId: string;
  title: string;
  purpose: string;
  description?: string;
}

export interface UpdateGoalInput {
  id: string;
  title?: string;
  purpose?: string;
  description?: string;
  status?: GoalStatus;
  sortOrder?: number;
}

export interface ListGoalsInput {
  status?: GoalStatus;
}
