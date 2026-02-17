# Quickstart: Task Management UI

**Feature**: 002-task-management-ui
**Date**: 2026-02-14

## Prerequisites

- Node.js 20+
- pnpm 9+
- Existing Clarity app running (`pnpm dev`)
- At least one brain dump processed with goals and tasks

## Setup

### 1. Install new dependencies

```bash
# Drag-and-drop
pnpm --filter @clarity/web add @atlaskit/pragmatic-drag-and-drop

# Calendar
pnpm --filter @clarity/web add @fullcalendar/react @fullcalendar/daygrid \
  @fullcalendar/timegrid @fullcalendar/interaction temporal-polyfill

# Toast / undo
pnpm --filter @clarity/web add sonner
```

### 2. Apply database schema changes

```bash
# After updating packages/db/src/schema.ts with new columns/tables
pnpm db:push
```

### 3. Build all packages

```bash
pnpm build
```

### 4. Start development

```bash
pnpm dev
```

## Verification Steps

### Drag-and-Drop Reordering
1. Navigate to a goal with 3+ tasks at `/goal/<id>`
2. Drag task 3 above task 1
3. Refresh the page — new order persists

### Task Deletion
1. Click the delete icon on any task
2. Confirm deletion
3. Click "Undo" in the toast within 5 seconds
4. Task reappears in its original position

### Inbox
1. Click the inbox icon in the nav (or use keyboard shortcut)
2. Type a quick task title and press Enter
3. Verify the inbox badge count increments
4. Assign the item to a goal — verify it appears in the goal's
   task list

### Calendar View
1. Navigate to `/calendar`
2. Drag a task from the sidebar onto a time slot
3. Resize the block by dragging its bottom edge
4. Move the block to a different day
5. Refresh — all changes persist

### Daily Planning
1. Visit the app at the start of a new day (or trigger manually)
2. Select tasks for today and assign estimates
3. Exceed 6 hours total — overcommitment warning appears
4. Confirm the plan — tasks appear on today's calendar

## New Routes

| Route | Description |
|-------|-------------|
| `/inbox` | Inbox view with unprocessed items |
| `/calendar` | Weekly/daily calendar with time blocks |
| `/plan` | Daily planning ritual flow |

## New CLI Commands (optional, future)

| Command | Description |
|---------|-------------|
| `clarity inbox` | List unprocessed inbox items |
| `clarity inbox add <text>` | Quick-capture to inbox |
| `clarity schedule <taskId> <date> <time>` | Schedule a task |
