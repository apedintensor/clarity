# Quickstart: Unified Inbox & Dashboard DnD

**Feature**: 003-unified-inbox-dnd | **Date**: 2026-02-14

## Setup

```bash
# Ensure on correct branch
git checkout 003-unified-inbox-dnd

# Install dependencies (no new packages expected)
pnpm install

# Push schema changes (adds deletedAt to goals, sortOrder + deletedAt to inbox_items)
pnpm db:push

# Start dev server
pnpm dev
```

## Integration Test Scenarios

### Scenario 1: Unified Inbox Capture (US1)

1. Navigate to `http://localhost:3000/inbox`
2. Type "Learn about TypeScript generics" in the capture input
3. Press Enter
4. **Verify**: Item appears in the inbox list immediately
5. **Verify**: Inbox badge count in nav increments

### Scenario 2: Inbox → Brain Dump Processing (US1)

1. Have an unprocessed inbox item
2. Right-click the item → select "Process" from context menu
3. **Verify**: Navigates to `/dump/{brainDumpId}` with clarification flow
4. **Verify**: Inbox item is marked as processed

### Scenario 3: Inbox → Assign to Goal (US1)

1. Have an unprocessed inbox item and at least one active goal
2. Right-click the item → select "Assign to Goal" from context menu
3. Select a goal from the picker
4. **Verify**: Item disappears from inbox (status = assigned)
5. **Verify**: A new task appears under the selected goal

### Scenario 4: Goal Card DnD Reorder (US2)

1. Have 3+ active goals on dashboard
2. Grab the drag handle on the third goal card
3. Drag it above the first goal card
4. Release
5. **Verify**: Cards reorder visually in real-time
6. Refresh the page
7. **Verify**: New order persists

### Scenario 5: Goal Card Deletion with Undo (US3)

1. Have an active goal on dashboard
2. Click the X button at the top-right of a goal card
3. **Verify**: Goal disappears, toast appears with "Undo" button
4. Click "Undo" within 5 seconds
5. **Verify**: Goal is restored to its original position
6. Repeat deletion and wait 5+ seconds without clicking Undo
7. **Verify**: Goal and all its tasks are permanently deleted
8. Refresh the page to confirm

### Scenario 6: Goal Card Deletion via Keyboard (US3)

1. Single-click a goal card to select it (visual highlight appears)
2. Press the Delete key on keyboard
3. **Verify**: Goal is deleted with the same undo toast behavior

### Scenario 7: Card Interaction Model (US6)

1. **Single-click** a goal card → **Verify**: selected state (highlighted border)
2. **Single-click** another card → **Verify**: previous deselects, new one selects
3. **Right-click** a goal card → **Verify**: context menu with Delete, Archive, Open
4. **Double-click** a goal card → **Verify**: detail modal opens with full goal info
5. Press Escape → **Verify**: modal closes
6. Double-click again, click outside modal → **Verify**: modal closes
7. Repeat steps 1-6 for inbox items (context menu: Process, Assign to Goal, Delete)

### Scenario 8: Inbox Item DnD Reorder (US4)

1. Have 3+ inbox items
2. Drag one item above another
3. **Verify**: Items reorder
4. Navigate away and return
5. **Verify**: Custom order persists

### Scenario 9: Inbox Item Deletion with Undo (US5)

1. Click the X button on an inbox item
2. **Verify**: Item disappears, toast with "Undo" appears
3. Click "Undo" within 5 seconds
4. **Verify**: Item is restored

### Scenario 10: Navigation Updates

1. **Verify**: Nav shows "Inbox" link (no separate "Brain Dump" link)
2. **Verify**: Dashboard shows "Inbox" button instead of "New Brain Dump"
3. Navigate to `/dump` directly
4. **Verify**: Redirects to `/inbox`

### Scenario 11: Edge Cases

1. Create a single goal → **Verify**: No drag handle shown on dashboard
2. Delete all goals → **Verify**: Empty state "No active goals" message
3. Process inbox item into goals, then the inbox item shows as processed (not in unprocessed list)
4. Delete a goal that has scheduled calendar tasks → **Verify**: Tasks removed from calendar
