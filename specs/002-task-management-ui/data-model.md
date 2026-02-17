# Data Model: Task Management UI

**Feature**: 002-task-management-ui
**Date**: 2026-02-14

## Existing Entities (modified)

### tasks (existing table — add columns)

New columns added to the existing `tasks` table:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| scheduled_date | text | nullable | ISO date (YYYY-MM-DD) when task is scheduled |
| scheduled_start | text | nullable | ISO time (HH:MM) start time on calendar |
| scheduled_duration | integer | nullable, default 30 | Duration in minutes |
| deleted_at | text | nullable | Soft-delete timestamp for undo support |

**Notes**:
- `sortOrder` already exists — used by drag-and-drop reordering.
- `estimatedMinutes` already exists — used by daily planning
  overcommitment calculation.
- `scheduled_date` + `scheduled_start` together represent a
  calendar time block. Both null = unscheduled.
- `deleted_at` enables soft delete: non-null means "deleted but
  undoable". A background cleanup removes rows where `deleted_at`
  is older than 30 seconds.

### goals (existing table — no schema changes)

- Progress recalculation logic changes (exclude soft-deleted
  tasks), but no new columns needed.

## New Entities

### inbox_items

Captures quick tasks before they are assigned to a goal.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID |
| user_id | text | NOT NULL, FK → users.id | Owner |
| title | text | NOT NULL | Item title |
| description | text | nullable | Optional details |
| status | text | NOT NULL, default "unprocessed" | Enum: unprocessed, assigned, deleted |
| assigned_goal_id | text | nullable, FK → goals.id | Goal this item was assigned to |
| assigned_task_id | text | nullable, FK → tasks.id | Task created when assigned |
| created_at | text | NOT NULL | ISO timestamp |
| updated_at | text | NOT NULL | ISO timestamp |

**Indexes**:
- `idx_inbox_user_status` on (user_id, status) — inbox list query
- `idx_inbox_created` on (created_at) — sort by newest

**State transitions**:
```
unprocessed → assigned  (user assigns to goal → task created)
unprocessed → deleted   (user deletes from inbox)
```

### daily_plans

Records a user's planning session for a given day.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PK | UUID |
| user_id | text | NOT NULL, FK → users.id | Owner |
| date | text | NOT NULL | ISO date (YYYY-MM-DD) |
| selected_task_ids | text (JSON) | NOT NULL | Array of task IDs selected for the day |
| total_estimated_minutes | integer | NOT NULL, default 0 | Sum of estimates |
| focus_threshold_minutes | integer | NOT NULL, default 360 | Overcommitment threshold |
| is_overcommitted | integer | NOT NULL, default 0 | Boolean (0/1) |
| status | text | NOT NULL, default "in_progress" | Enum: in_progress, confirmed, skipped |
| created_at | text | NOT NULL | ISO timestamp |
| updated_at | text | NOT NULL | ISO timestamp |

**Indexes**:
- `idx_daily_plan_user_date` UNIQUE on (user_id, date) — one plan
  per day per user

**State transitions**:
```
in_progress → confirmed  (user finishes planning)
in_progress → skipped    (user dismisses planning)
```

## Entity Relationships

```
users (1) ──→ (N) inbox_items
users (1) ──→ (N) daily_plans
goals (1) ──→ (N) tasks          (existing)
inbox_items (1) ──→ (0..1) tasks  (when assigned)
daily_plans ──→ tasks             (via selected_task_ids JSON)
```

## Validation Rules

- `inbox_items.title`: 1–500 characters, trimmed, non-empty after
  trim.
- `tasks.scheduled_date`: valid ISO date or null.
- `tasks.scheduled_start`: valid HH:MM (00:00–23:59) or null.
- `tasks.scheduled_duration`: 5–480 minutes (5 min to 8 hours)
  when set.
- `daily_plans.date`: valid ISO date, cannot be in the past
  (except today).
- `daily_plans.focus_threshold_minutes`: 60–720 (1 to 12 hours).
