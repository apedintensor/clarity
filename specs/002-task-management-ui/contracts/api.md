# API Contracts: Task Management UI

**Feature**: 002-task-management-ui
**Date**: 2026-02-14
**Protocol**: tRPC v11 procedures (shared via `packages/core`)

## Task Router (existing — new procedures)

### task.reorder

Reorder tasks within a goal after drag-and-drop.

**Input**:
```typescript
{
  goalId: string;          // Goal containing the tasks
  taskIds: string[];       // Ordered array of task IDs (new order)
}
```

**Output**:
```typescript
{ success: true }
```

**Behavior**:
- Updates `sortOrder` for each task to match array index.
- Validates all taskIds belong to the given goalId.
- Ignores soft-deleted tasks (deleted_at not null).

---

### task.softDelete

Soft-delete a task (marks deleted_at, allows undo).

**Input**:
```typescript
{
  taskId: string;
}
```

**Output**:
```typescript
{
  id: string;
  deletedAt: string;       // ISO timestamp
  hadSubtasks: boolean;    // Whether subtasks were also deleted
  subtaskCount: number;    // Number of subtasks deleted
}
```

**Behavior**:
- Sets `deleted_at` to current timestamp.
- If task has subtasks, also soft-deletes all subtasks.
- Removes any associated calendar scheduling data.
- Recalculates parent goal progress (excluding soft-deleted).

---

### task.undoDelete

Restore a soft-deleted task within the undo window.

**Input**:
```typescript
{
  taskId: string;
}
```

**Output**:
```typescript
{ success: true; restoredCount: number }
```

**Behavior**:
- Clears `deleted_at` on the task and its subtasks.
- Restores original `sortOrder`.
- Recalculates parent goal progress.
- Returns error if task's `deleted_at` is older than 30 seconds.

---

### task.permanentDelete

Hard-delete tasks whose undo window has expired. Called
automatically by a cleanup routine or on page unload.

**Input**:
```typescript
{
  olderThanSeconds?: number;  // Default: 30
}
```

**Output**:
```typescript
{ deletedCount: number }
```

---

### task.schedule

Assign or update calendar scheduling for a task.

**Input**:
```typescript
{
  taskId: string;
  scheduledDate: string;      // ISO date YYYY-MM-DD
  scheduledStart: string;     // HH:MM
  scheduledDuration: number;  // Minutes (5–480)
}
```

**Output**:
```typescript
{
  id: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledDuration: number;
}
```

**Behavior**:
- Validates task exists and is not soft-deleted.
- Validates task belongs to a goal (not an unassigned inbox item).
- Overlapping schedules are allowed.

---

### task.unschedule

Remove calendar scheduling from a task.

**Input**:
```typescript
{
  taskId: string;
}
```

**Output**:
```typescript
{ success: true }
```

---

### task.getScheduled

Get all scheduled tasks for a date range (calendar view).

**Input**:
```typescript
{
  userId: string;
  startDate: string;    // ISO date
  endDate: string;      // ISO date
}
```

**Output**:
```typescript
Array<{
  id: string;
  title: string;
  goalId: string;
  goalTitle: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledDuration: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
  estimatedMinutes: number;
}>
```

## Inbox Router (new)

### inbox.create

Quick-capture a new inbox item.

**Input**:
```typescript
{
  userId: string;
  title: string;             // 1–500 chars
  description?: string;
}
```

**Output**:
```typescript
{
  id: string;
  title: string;
  description: string | null;
  status: "unprocessed";
  createdAt: string;
}
```

---

### inbox.list

List all inbox items for a user.

**Input**:
```typescript
{
  userId: string;
  status?: "unprocessed" | "assigned" | "deleted";  // Default: "unprocessed"
}
```

**Output**:
```typescript
Array<{
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
}>
```

---

### inbox.count

Get the count of unprocessed inbox items (for badge).

**Input**:
```typescript
{
  userId: string;
}
```

**Output**:
```typescript
{ count: number }
```

---

### inbox.assignToGoal

Assign an inbox item to an existing goal, creating a task.

**Input**:
```typescript
{
  inboxItemId: string;
  goalId: string;
}
```

**Output**:
```typescript
{
  inboxItemId: string;
  createdTaskId: string;
  goalId: string;
}
```

**Behavior**:
- Creates a new task in the goal with the inbox item's title
  and description.
- Sets inbox item status to "assigned" and records the created
  task ID.
- Task is appended to the end of the goal's task list
  (highest sortOrder + 1).

---

### inbox.delete

Delete an inbox item.

**Input**:
```typescript
{
  inboxItemId: string;
}
```

**Output**:
```typescript
{ success: true }
```

## Daily Plan Router (new)

### dailyPlan.start

Begin or resume daily planning for today.

**Input**:
```typescript
{
  userId: string;
}
```

**Output**:
```typescript
{
  id: string;
  date: string;
  yesterdayUnfinished: Array<{
    id: string;
    title: string;
    goalTitle: string;
    estimatedMinutes: number;
  }>;
  existingSelections: string[];   // Task IDs already selected
  focusThresholdMinutes: number;
  status: "in_progress" | "confirmed";
}
```

**Behavior**:
- If a plan for today already exists, returns it (resume).
- If no plan exists, creates one and fetches yesterday's
  unfinished tasks.

---

### dailyPlan.updateSelections

Update the selected tasks for today's plan.

**Input**:
```typescript
{
  planId: string;
  selectedTaskIds: string[];
}
```

**Output**:
```typescript
{
  totalEstimatedMinutes: number;
  isOvercommitted: boolean;
  overcommittedByMinutes: number;
}
```

---

### dailyPlan.confirm

Confirm the daily plan and schedule selected tasks.

**Input**:
```typescript
{
  planId: string;
}
```

**Output**:
```typescript
{
  confirmedTaskCount: number;
  totalEstimatedMinutes: number;
}
```

**Behavior**:
- Sets plan status to "confirmed".
- Schedules all selected tasks on today's calendar (if not
  already scheduled).

---

### dailyPlan.skip

Dismiss the daily planning prompt.

**Input**:
```typescript
{
  planId: string;
}
```

**Output**:
```typescript
{ success: true }
```
