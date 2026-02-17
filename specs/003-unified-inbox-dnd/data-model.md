# Data Model: Unified Inbox & Dashboard DnD

**Feature**: 003-unified-inbox-dnd | **Date**: 2026-02-14

## Entity Changes

### goals (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| deletedAt | text (ISO datetime), nullable | **ADD** | Soft-delete support. NULL = active. When set, goal is hidden from list/dashboard. |

- `goal.list` and `goal.get` MUST filter `WHERE deletedAt IS NULL`
- `goal.softDelete` sets `deletedAt = now()` and cascade soft-deletes all tasks under the goal
- `goal.undoDelete` sets `deletedAt = NULL` and restores cascade-deleted tasks
- After 5-second undo window, permanent deletion removes the goal row and all associated tasks
- Existing `sortOrder` field already supports reordering; add `goal.reorder` procedure

### inbox_items (modified)

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| sortOrder | integer, NOT NULL, default 0 | **ADD** | Custom ordering via DnD. 0 = use chronological fallback. |
| deletedAt | text (ISO datetime), nullable | **ADD** | Soft-delete with undo (replaces hard status='deleted'). |

- `inbox.list` MUST order by `sortOrder ASC, createdAt DESC` and filter `WHERE deletedAt IS NULL`
- The existing `status: "deleted"` enum value is kept for backward compatibility but new deletions use `deletedAt`
- `inbox.softDelete` sets `deletedAt = now()`
- `inbox.undoDelete` sets `deletedAt = NULL`

### brain_dumps (unchanged)

No schema changes. Brain dumps are created from inbox items via the "Process" action, which calls the existing `braindump.create` procedure.

### tasks (unchanged)

Already has `deletedAt` column and `softDelete`/`undoDelete` procedures. When a goal is soft-deleted, its tasks are cascade soft-deleted using the existing `deletedAt` mechanism.

## State Transitions

### Goal Lifecycle (updated)

```
active → completed (all tasks done)
active → archived (user archives)
active → soft-deleted (deletedAt set) → permanent delete (after 5s) OR → active (undo)
```

### Inbox Item Lifecycle (updated)

```
unprocessed → assigned (assign to goal → creates task)
unprocessed → processed (process → creates brain dump → clarification flow)
unprocessed → soft-deleted (deletedAt set) → permanent delete (after 5s) OR → unprocessed (undo)
```

## Indexes

No new indexes needed:
- `idx_goal_user_status` already covers goal listing
- `idx_inbox_user_status` already covers inbox listing
- Sort operations use in-memory reorder with batch update (same pattern as task reorder)
