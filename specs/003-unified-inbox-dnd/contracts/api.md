# API Contracts: Unified Inbox & Dashboard DnD

**Feature**: 003-unified-inbox-dnd | **Date**: 2026-02-14

All procedures are tRPC v11 publicProcedure with Zod input validation.

## Goal Router — New Procedures

### goal.reorder

Reorder goal cards on the dashboard. Persists new sort order.

**Input**:
```typescript
z.object({
  goalIds: z.array(z.string().uuid()),  // Goal IDs in desired order
})
```

**Output**:
```typescript
{ success: true }
```

**Behavior**: Sets `sortOrder = index` for each goal in the array. Only updates goals belonging to the current user.

---

### goal.softDelete

Soft-delete a goal and cascade to all its tasks.

**Input**:
```typescript
z.object({
  id: z.string().uuid(),
})
```

**Output**:
```typescript
{
  id: string;
  deletedAt: string;            // ISO datetime
  cascadeDeletedTaskIds: string[];  // Task IDs that were cascade-deleted
}
```

**Behavior**:
1. Sets `deletedAt = now()` on the goal
2. Sets `deletedAt = now()` on all tasks where `goalId = id` and `deletedAt IS NULL`
3. Returns the list of cascade-deleted task IDs (for undo restoration)

---

### goal.undoDelete

Restore a soft-deleted goal and its cascade-deleted tasks.

**Input**:
```typescript
z.object({
  id: z.string().uuid(),
  cascadeDeletedTaskIds: z.array(z.string().uuid()),
})
```

**Output**:
```typescript
{ success: true }
```

**Behavior**:
1. Sets `deletedAt = NULL` on the goal
2. Sets `deletedAt = NULL` on tasks whose IDs are in `cascadeDeletedTaskIds`

---

### goal.permanentDelete

Permanently remove a goal and all its tasks.

**Input**:
```typescript
z.object({
  id: z.string().uuid(),
})
```

**Output**:
```typescript
{ success: true }
```

**Behavior**:
1. Deletes all tasks where `goalId = id`
2. Deletes the goal row
3. Removes any scheduled calendar entries for deleted tasks

---

### goal.list (modified)

**Change**: Add filter `WHERE deletedAt IS NULL` to exclude soft-deleted goals.

### goal.get (modified)

**Change**: Add filter `WHERE deletedAt IS NULL`. Return 404 for soft-deleted goals.

---

## Inbox Router — New/Modified Procedures

### inbox.reorder

Reorder inbox items via drag-and-drop.

**Input**:
```typescript
z.object({
  itemIds: z.array(z.string().uuid()),  // Item IDs in desired order
})
```

**Output**:
```typescript
{ success: true }
```

**Behavior**: Sets `sortOrder = index` for each item in the array.

---

### inbox.softDelete

Soft-delete an inbox item with undo support.

**Input**:
```typescript
z.object({
  id: z.string().uuid(),
})
```

**Output**:
```typescript
{ id: string; deletedAt: string }
```

**Behavior**: Sets `deletedAt = now()` on the inbox item.

---

### inbox.undoDelete

Restore a soft-deleted inbox item.

**Input**:
```typescript
z.object({
  id: z.string().uuid(),
})
```

**Output**:
```typescript
{ success: true }
```

**Behavior**: Sets `deletedAt = NULL` on the inbox item.

---

### inbox.process

Create a brain dump from an inbox item and mark it as processed.

**Input**:
```typescript
z.object({
  inboxItemId: z.string().uuid(),
})
```

**Output**:
```typescript
{ brainDumpId: string }
```

**Behavior**:
1. Look up the inbox item
2. Call `braindump.create` internally with `rawText = item.title + "\n\n" + item.description`
3. Update inbox item status to `"assigned"` (reusing existing status to indicate processed)
4. Return the new brain dump ID so the UI can navigate to `/dump/{brainDumpId}`

---

### inbox.list (modified)

**Changes**:
- Filter `WHERE deletedAt IS NULL` (in addition to existing status filter)
- Order by `sortOrder ASC, createdAt DESC` (instead of just createdAt)

### inbox.count (modified)

**Changes**:
- Filter `WHERE deletedAt IS NULL` (in addition to existing status filter)

### inbox.delete (deprecated)

Existing hard-delete procedure. Kept for backward compatibility but UI should use `inbox.softDelete` for new deletions.
