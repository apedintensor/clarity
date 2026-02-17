export type InboxItemStatus = "unprocessed" | "assigned" | "deleted";

export interface InboxItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: InboxItemStatus;
  assignedGoalId: string | null;
  assignedTaskId: string | null;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInboxItemInput {
  userId: string;
  title: string;
  description?: string;
}

export interface AssignInboxItemInput {
  inboxItemId: string;
  goalId: string;
}

export interface AssignInboxItemOutput {
  inboxItemId: string;
  createdTaskId: string;
  goalId: string;
}
