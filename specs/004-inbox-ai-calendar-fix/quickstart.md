# Quickstart Scenarios: Inbox AI Chat & Calendar Fixes

**Feature**: 004-inbox-ai-calendar-fix
**Date**: 2026-02-14

## Prerequisites

- Run `pnpm install` and `pnpm db:push` from repo root
- Set `GOOGLE_GENERATIVE_AI_API_KEY` environment variable
- Start dev server with `pnpm dev`
- Navigate to `http://localhost:3000`

---

## Scenario 1: AI Chat from Inbox Item

1. Navigate to /inbox
2. Type "I want to learn Spanish but I don't know where to start" and press Enter
3. Double-click the new inbox item
4. **Expected**: A modal opens with the inbox item text and an AI chat interface
5. Type "What do you think about this idea?" and send
6. **Expected**: AI responds conversationally, asking clarifying questions about your Spanish learning goals
7. Continue the conversation for 2-3 exchanges
8. **Expected**: Each message appears in the chat, AI maintains context from previous messages

## Scenario 2: AI Generates Goal Suggestions

1. Continue from Scenario 1's conversation
2. Type "Can you suggest some goals for this?"
3. **Expected**: AI generates structured goal suggestions with titles, purposes, and tasks
4. **Expected**: Suggestions appear as interactive cards with Accept/Modify/Reject buttons

## Scenario 3: Accept AI Suggestion

1. Continue from Scenario 2
2. Click "Accept" on one of the suggested goals
3. **Expected**: Goal is created and appears on the dashboard
4. Navigate to dashboard
5. **Expected**: The new goal appears with its tasks

## Scenario 4: Conversation Persistence

1. Open an inbox item that has a previous AI conversation (from Scenarios 1-3)
2. Close the modal (press Escape or click outside)
3. Double-click the same inbox item again
4. **Expected**: Previous conversation messages are fully restored

## Scenario 5: Convert Inbox Item to Goal

1. Navigate to /inbox
2. Add an item: "Run a half marathon"
3. Right-click the item
4. **Expected**: Context menu shows "Process", "Assign to Goal", "Convert to Goal", "Convert to Task", "Convert to Subtask", "Delete"
5. Click "Convert to Goal"
6. **Expected**: A new goal "Run a half marathon" appears on the dashboard, the inbox item disappears

## Scenario 6: Convert Inbox Item to Task

1. Navigate to /inbox (ensure at least one goal exists)
2. Add an item: "Buy running shoes"
3. Right-click → "Convert to Task"
4. **Expected**: A goal picker dropdown appears
5. Select the "Run a half marathon" goal
6. **Expected**: Task created under that goal, inbox item removed

## Scenario 7: Convert Inbox Item to Subtask

1. Navigate to /inbox (ensure at least one goal with tasks exists)
2. Add an item: "Research shoe brands"
3. Right-click → "Convert to Subtask"
4. **Expected**: A goal picker appears, then a task picker for the selected goal
5. Select goal and parent task
6. **Expected**: Subtask created under the chosen task, inbox item removed

## Scenario 8: Calendar Shows All Tasks

1. Create 3 goals with 2 tasks each (via dashboard or AI)
2. Schedule all 6 tasks to dates within the current week
3. Navigate to /calendar
4. **Expected**: All 6 tasks appear on the calendar, none missing
5. **Expected**: Each goal's tasks have a distinct color

## Scenario 9: Calendar Monday Start

1. Navigate to /calendar
2. **Expected**: Week view starts with Monday as the first column
3. **Expected**: Sunday is the last column
4. Click "Next" to advance the week
5. **Expected**: View shows the next Monday through Sunday

## Scenario 10: Calendar Right-Click Context Menu

1. Navigate to /calendar with scheduled tasks visible
2. Right-click on a task event
3. **Expected**: Context menu appears with Edit, Reschedule, Complete, Delete
4. Click "Edit"
5. **Expected**: Modal opens with editable task fields (title, description, date, time, duration)
6. Change the title and save
7. **Expected**: Calendar event updates with new title

## Scenario 11: Calendar Right-Click Complete

1. Right-click a task event on the calendar
2. Click "Complete"
3. **Expected**: Task is marked as completed, event color changes to muted/faded variant

## Scenario 12: Calendar Right-Click Delete

1. Right-click a task event on the calendar
2. Click "Delete"
3. **Expected**: Task disappears, undo toast appears for 5 seconds
4. Click "Undo" within 5 seconds
5. **Expected**: Task reappears on the calendar

## Scenario 13: Calendar Goal Colors

1. Have tasks from 3+ different goals on the calendar
2. **Expected**: Each goal's tasks are a distinct color (blue, red, emerald, amber, etc.)
3. Check sidebar — unscheduled tasks show matching color indicators
4. Complete a task
5. **Expected**: Completed task shows in a muted/faded variant of its goal color

## Scenario 14: Calendar Reschedule via Context Menu

1. Right-click a task event on the calendar
2. Click "Reschedule"
3. **Expected**: A date/time picker appears
4. Select a new date/time
5. **Expected**: Task moves to the new position on the calendar

## Scenario 15: AI Chat Error Handling

1. Disconnect from internet (or invalidate the API key temporarily)
2. Open an inbox item's AI chat
3. Send a message
4. **Expected**: Error message appears in the chat with a retry option
5. Restore connectivity and retry
6. **Expected**: AI responds normally
