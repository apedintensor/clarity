# Feature Specification: Task Management UI

**Feature Branch**: `002-task-management-ui`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Drag-and-drop task reordering, easy deletion, calendar scheduling (Sunsama workflow), Todoist-style inbox"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drag-and-Drop Task Reordering (Priority: P1)

A user viewing a goal's task list wants to rearrange tasks and
subtasks by dragging them to a new position. The user grabs a task
row, drags it above or below other tasks, and drops it. The new
order persists immediately. Subtasks can be reordered within their
parent and can also be promoted or demoted (dragged out of or into
a parent task group).

**Why this priority**: Reordering is the most fundamental
interaction improvement. Without it, the user has no control over
task sequence, which undermines the entire planning workflow.

**Independent Test**: Can be fully tested by creating a goal with
3+ tasks, dragging task 3 to position 1, refreshing the page, and
verifying the new order persists.

**Acceptance Scenarios**:

1. **Given** a goal with tasks A, B, C in order, **When** the user
   drags task C above task A, **Then** the list shows C, A, B and
   the new order is saved.
2. **Given** a task with subtasks S1, S2, S3, **When** the user
   drags S3 between S1 and S2, **Then** the subtask order updates
   to S1, S3, S2.
3. **Given** a task list on a mobile-width viewport, **When** the
   user long-presses and drags a task, **Then** the drag-and-drop
   interaction works the same as on desktop.
4. **Given** a task being dragged, **When** the user drops it in
   an invalid area (e.g., outside the list), **Then** the task
   returns to its original position with no data change.

---

### User Story 2 - Quick Task Deletion (Priority: P1)

A user wants to remove a task or subtask they no longer need. Each
task row displays a delete action (icon button or swipe gesture).
Tapping delete shows a brief confirmation, and the task is removed.
An undo option appears for a short window after deletion.

**Why this priority**: Deletion is equally fundamental to
reordering — users need to prune their task lists to stay focused.
Without easy deletion, clutter accumulates and defeats the purpose
of the tool.

**Independent Test**: Can be tested by creating a task, clicking
the delete button, confirming deletion, verifying the task is gone,
and then testing the undo action restores it.

**Acceptance Scenarios**:

1. **Given** a task list with tasks A, B, C, **When** the user
   clicks delete on task B and confirms, **Then** only tasks A and
   C remain.
2. **Given** a task was just deleted, **When** the user clicks
   "Undo" within 5 seconds, **Then** the task reappears in its
   original position.
3. **Given** a task with subtasks, **When** the user deletes the
   parent task, **Then** a warning indicates all subtasks will also
   be removed, and upon confirmation all are deleted.
4. **Given** a completed task, **When** the user deletes it,
   **Then** it is removed and the goal's progress recalculates.

---

### User Story 3 - Inbox Capture (Priority: P2)

Inspired by Todoist's inbox, the user has a universal inbox where
quick thoughts, tasks, and to-dos can be captured without needing
to assign them to a goal first. The inbox is a persistent
catch-all. Items sit in the inbox until the user triages them:
assigning each to a goal, scheduling it, or deleting it. The inbox
badge shows the count of unprocessed items.

**Why this priority**: The inbox decouples capture from
organization. Users can dump tasks fast (like a mini brain dump)
and organize later, reducing friction for quick capture throughout
the day.

**Independent Test**: Can be tested by adding 3 items to the inbox,
verifying the badge count shows 3, assigning one to a goal, and
verifying the count drops to 2 and the task appears under that
goal.

**Acceptance Scenarios**:

1. **Given** the user is on any page, **When** they use the quick-
   capture shortcut or click the inbox button, **Then** a capture
   input appears and they can type a task title and press Enter to
   add it.
2. **Given** the inbox has 5 items, **When** the user assigns item
   3 to an existing goal, **Then** the item moves to that goal's
   task list and the inbox count drops to 4.
3. **Given** an inbox item, **When** the user schedules it for a
   date, **Then** the item appears on the calendar for that date.
4. **Given** the inbox is empty, **When** the user views it,
   **Then** a friendly empty state message is shown (e.g., "All
   clear! Nothing in your inbox.").

---

### User Story 4 - Calendar View and Scheduling (Priority: P2)

Inspired by Sunsama's time-blocking approach, the user can view
a weekly calendar that shows their scheduled tasks as time blocks.
Tasks can be dragged from a task list sidebar onto the calendar to
assign them a date and time slot. Tasks already on the calendar can
be resized (to change duration) or moved to a different time slot.

**Why this priority**: Calendar scheduling transforms tasks from a
flat list into a time-aware plan. It enables users to see their
workload distribution and commit to when they will do each task.

**Independent Test**: Can be tested by dragging a task from the
sidebar onto Wednesday at 2pm, verifying the block appears,
resizing it to 1 hour, and refreshing to verify persistence.

**Acceptance Scenarios**:

1. **Given** the calendar view is open, **When** the user drags a
   task from the sidebar onto Tuesday at 10:00 AM, **Then** a time
   block appears for that task on Tuesday at 10:00 AM with a
   default duration of 30 minutes.
2. **Given** a task is scheduled on the calendar, **When** the user
   drags the bottom edge of the block downward, **Then** the task
   duration extends and the new duration persists.
3. **Given** a task block on Monday at 9 AM, **When** the user
   drags it to Wednesday at 3 PM, **Then** the task moves to the
   new date and time.
4. **Given** the user is viewing the weekly calendar, **When** they
   click a day header, **Then** the view switches to a daily view
   for that day showing more detail.
5. **Given** a task is scheduled for today, **When** the user
   marks it as done from the calendar, **Then** the block shows a
   completed state and the goal progress updates.

---

### User Story 5 - Daily Planning Ritual (Priority: P3)

Inspired by Sunsama's guided daily planning, the system prompts
the user each day to plan their day. The ritual includes:
reviewing tasks left over from yesterday, selecting tasks for
today, estimating time for each, and reviewing total workload. If
the total estimated time exceeds a configurable threshold (default
6 hours of focused work), a warning indicates overcommitment.

**Why this priority**: The daily planning ritual ties together all
other features (inbox triage, calendar scheduling, task ordering)
into a guided flow. It depends on the other features being in place
first.

**Independent Test**: Can be tested by triggering the daily
planning flow, selecting 3 tasks, assigning time estimates, and
verifying the overcommitment warning when total exceeds 6 hours.

**Acceptance Scenarios**:

1. **Given** the user opens the app at the start of a new day,
   **When** they have unfinished tasks from yesterday, **Then** the
   planning flow shows those tasks and asks which to carry forward,
   defer, or remove.
2. **Given** the planning flow, **When** the user selects tasks
   for today totaling 7 hours, **Then** a warning appears stating
   they are overcommitted by 1 hour.
3. **Given** the user finishes planning, **When** they confirm
   their daily plan, **Then** the selected tasks appear on today's
   calendar view and the inbox items not selected remain in the
   inbox.
4. **Given** the user has already completed daily planning today,
   **When** they visit the app again, **Then** they go directly to
   the dashboard without the planning prompt (but can re-trigger
   it manually).

---

### Edge Cases

- What happens when the user drags a task while another device or
  tab has the same list open? (Assumption: single-user local app,
  so concurrent editing is not a concern.)
- What happens when a task is deleted that is scheduled on the
  calendar? The calendar block MUST also be removed.
- What happens when all tasks in a goal are deleted? The goal
  remains with 0 tasks and 0% progress.
- What happens when the user drags an inbox item directly onto the
  calendar without assigning a goal first? The system MUST require
  the user to assign the item to a goal before it can be scheduled.
  The drag is rejected and the user is prompted to assign a goal
  first.
- What happens when the user tries to schedule a task at a time
  that overlaps with another task? (Assumption: overlapping is
  allowed; the calendar displays overlapping blocks side by side.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to reorder tasks within a
  goal by drag-and-drop, persisting the new sort order immediately.
- **FR-002**: System MUST allow users to reorder subtasks within
  a parent task by drag-and-drop.
- **FR-003**: System MUST support drag-and-drop on both desktop
  (mouse) and mobile (touch) viewports.
- **FR-004**: System MUST provide a delete action on every task and
  subtask row.
- **FR-005**: System MUST show a confirmation before deleting a
  task that has subtasks.
- **FR-006**: System MUST offer an undo option for 5 seconds after
  task deletion.
- **FR-007**: System MUST provide an inbox view where users can
  capture tasks without assigning them to a goal.
- **FR-008**: System MUST display an unread/unprocessed badge count
  on the inbox.
- **FR-009**: System MUST allow users to assign inbox items to an
  existing goal.
- **FR-010**: System MUST allow users to schedule inbox items to a
  specific date.
- **FR-011**: System MUST provide a weekly calendar view showing
  tasks as time blocks.
- **FR-012**: System MUST allow users to drag tasks from a sidebar
  onto the calendar to schedule them.
- **FR-013**: System MUST allow users to resize scheduled task
  blocks to change their duration.
- **FR-014**: System MUST allow users to move scheduled task blocks
  to different dates and times by dragging.
- **FR-015**: System MUST allow switching between weekly and daily
  calendar views.
- **FR-016**: System MUST provide a daily planning flow that shows
  yesterday's unfinished tasks and lets the user select, estimate,
  and confirm today's plan.
- **FR-017**: System MUST warn the user when the total estimated
  time for the day exceeds a configurable threshold (default 6
  hours).
- **FR-018**: System MUST recalculate goal progress when tasks are
  deleted or reordered.
- **FR-019**: System MUST remove calendar blocks when their
  associated task is deleted.
- **FR-020**: System MUST persist all scheduling data (date, start
  time, duration) for each task.

### Key Entities

- **Inbox Item**: A quick-capture task not yet assigned to a goal.
  Attributes: title, optional description, created date, status
  (unprocessed / assigned / scheduled / deleted).
- **Task Schedule**: A time allocation for a task on the calendar.
  Attributes: associated task, scheduled date, start time,
  duration, status (planned / completed).
- **Daily Plan**: A record of the user's planning session for a
  given day. Attributes: date, selected task IDs, total estimated
  minutes, overcommitment flag, completion status.

### Assumptions

- Single-user, local-only — no concurrent editing conflicts.
- Overlapping time blocks on the calendar are allowed and display
  side by side.
- Default task duration when dragged to calendar is 30 minutes.
- Undo window for deletion is 5 seconds (soft delete until window
  expires).
- Daily planning prompt appears once per calendar day; can be
  re-triggered manually.
- The configurable overcommitment threshold defaults to 360
  minutes (6 hours).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can reorder a 10-task list to any desired
  sequence in under 15 seconds using drag-and-drop.
- **SC-002**: Users can delete a task and undo the deletion in
  under 3 seconds total interaction time.
- **SC-003**: Users can capture an inbox item (from idea to saved)
  in under 5 seconds.
- **SC-004**: Users can schedule a task on the calendar by dragging
  it from the sidebar in a single interaction (no multi-step
  dialog).
- **SC-005**: Users can complete the daily planning ritual
  (reviewing yesterday, selecting today's tasks, confirming) in
  under 3 minutes.
- **SC-006**: The overcommitment warning appears within 1 second of
  the total exceeding the threshold.
- **SC-007**: 90% of users can discover and use the inbox capture
  feature without guidance on first visit.
