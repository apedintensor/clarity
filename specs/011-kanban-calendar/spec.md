# Feature Specification: Kanban Calendar

**Feature Branch**: `011-kanban-calendar`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Replace the FullCalendar time-grid view with a Sunsama-style kanban weekly board. Days are columns, tasks are cards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kanban Weekly Board View (Priority: P1)

The Calendar page is replaced with a kanban-style weekly board. Each day of the week is a vertical column. The column header shows the day name (e.g., "Sunday") and the date (e.g., "February 15"). Today's column is visually highlighted and shows a progress bar indicating how many of the day's tasks are completed. Each task appears as a card within its scheduled day column, showing: the task title, estimated or scheduled duration (e.g., "0:30"), the parent goal as a colored tag (e.g., "# agent"), and a completion status indicator. Completed tasks show a green checkmark. The board scrolls horizontally to reveal additional days if needed.

**Why this priority**: This is the core replacement — the entire calendar experience shifts from a time-grid to a kanban board, which is the user's primary request.

**Independent Test**: Navigate to the Calendar page. Instead of a time-grid, see 7 day columns across the screen. Today is highlighted. Tasks appear as cards in their scheduled day column with title, duration, and goal tag visible. Completed tasks show a green checkmark.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Calendar page, **When** the page loads, **Then** a kanban board is displayed with day columns for the current week (7 days starting from today or Sunday).
2. **Given** tasks are scheduled for various days, **When** the user views the board, **Then** each task appears as a card in the correct day column showing title, duration, and goal tag.
3. **Given** today has scheduled tasks, **When** the user views today's column header, **Then** a progress bar shows the ratio of completed to total tasks.
4. **Given** a task is marked as completed, **When** the user views it on the board, **Then** the task card shows a green completion checkmark.
5. **Given** a day has no tasks, **When** the user views that column, **Then** the column shows an empty state with just the "+ Add task" button.

---

### User Story 2 - Drag-and-Drop Between Days (Priority: P2)

The user can drag a task card from one day column to another to reschedule it to a different day. Dragging a task from Monday to Wednesday updates the task's scheduled date to Wednesday. The board updates immediately to reflect the new placement. The user can also reorder tasks within a day column by dragging them up or down.

**Why this priority**: Drag-and-drop is the primary interaction for rescheduling in a kanban view. Without it, the board is read-only.

**Independent Test**: Drag a task card from Monday's column to Wednesday's column. The task moves to Wednesday and its scheduled date updates. Drag a task up within a day column to reorder it.

**Acceptance Scenarios**:

1. **Given** a task is in Monday's column, **When** the user drags it to Wednesday's column, **Then** the task moves to Wednesday and its scheduled date updates to Wednesday's date.
2. **Given** a task is dragged to a different day, **When** the drop completes, **Then** the task card immediately appears in the target column and disappears from the source column.
3. **Given** two tasks in the same day column, **When** the user drags one above the other, **Then** the task order within that day updates visually.

---

### User Story 3 - Task Card Actions (Priority: P3)

Each task card supports quick actions. Clicking the completion circle toggles the task between pending and completed. Double-clicking the card opens the edit modal (prepopulated with task data) for detailed editing. Right-clicking shows a context menu with options: Edit, Complete, Reschedule, and Remove from Calendar. The edit modal includes all task fields: title, description, date, time, duration, estimated minutes, and status.

**Why this priority**: Users need to interact with individual tasks beyond just viewing them — marking complete, editing details, and managing their schedule.

**Independent Test**: Click the completion circle on a task card — it toggles to completed with a green checkmark. Double-click a card — the edit modal opens prepopulated. Right-click — a context menu appears with Edit, Complete, Reschedule, Remove options.

**Acceptance Scenarios**:

1. **Given** a pending task card, **When** the user clicks the completion circle, **Then** the task is marked as completed and shows a green checkmark.
2. **Given** a completed task card, **When** the user clicks the completion circle, **Then** the task reverts to pending status.
3. **Given** a task card, **When** the user double-clicks it, **Then** the edit modal opens with all fields prepopulated from the task's existing data.
4. **Given** a task card, **When** the user right-clicks it, **Then** a context menu appears with Edit, Complete, Reschedule, and Remove options.
5. **Given** the edit modal is open, **When** the user modifies the title and saves, **Then** the task card on the board updates to show the new title.

---

### User Story 4 - Backlog Panel with Unscheduled Tasks (Priority: P4)

A sidebar panel (left side) shows unscheduled tasks organized by goal. Each unscheduled task card displays title, estimated duration, and goal tag. The user can drag an unscheduled task from the backlog onto any day column to schedule it for that day. When a task is dragged from the board back to the backlog, it becomes unscheduled. The backlog also shows a summary: total tasks, total estimated time.

**Why this priority**: The backlog gives users a pool of unscheduled tasks to pull from when planning their week, completing the kanban workflow.

**Independent Test**: View the backlog panel with unscheduled tasks. Drag a task from the backlog to Tuesday's column. The task is now scheduled for Tuesday and disappears from the backlog.

**Acceptance Scenarios**:

1. **Given** the Calendar page loads, **When** the user views the left panel, **Then** unscheduled tasks are listed grouped by goal with title, duration, and goal tag.
2. **Given** an unscheduled task exists in the backlog, **When** the user drags it onto Wednesday's column, **Then** the task is scheduled for Wednesday and appears in that column.
3. **Given** a scheduled task exists on the board, **When** the user drags it to the backlog area, **Then** the task becomes unscheduled and appears in the backlog.
4. **Given** the backlog panel, **When** the user views the summary, **Then** it shows the count of unscheduled tasks and total estimated time.

---

### Edge Cases

- What happens when a day has many tasks that overflow the column? The column becomes scrollable within its area.
- What happens when there are no tasks at all (no goals created)? The board shows empty columns with a message: "No tasks yet. Create goals and tasks to get started."
- What happens when the user drags a task to the same column it's already in? The task stays in place (no unnecessary update fires).
- What happens when the screen is narrow (mobile)? The columns stack or become horizontally scrollable with snap behavior.
- What happens with tasks scheduled for days outside the visible week? They are not shown on the board but remain in the system. Navigating to previous/next week reveals them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Calendar page MUST display a kanban board with one column per day of the week.
- **FR-002**: Each day column MUST show the day name and date in its header.
- **FR-003**: Today's column MUST be visually distinguished (highlight or accent) with a progress bar.
- **FR-004**: Each task card MUST display: task title, duration, goal tag (with goal color), and completion status.
- **FR-005**: Users MUST be able to drag task cards between day columns to reschedule them.
- **FR-006**: Users MUST be able to click a completion indicator on a task card to toggle done/pending.
- **FR-007**: Double-clicking a task card MUST open an edit modal prepopulated with all task data.
- **FR-008**: Right-clicking a task card MUST show a context menu with Edit, Complete, Reschedule, and Remove options.
- **FR-009**: A backlog panel MUST display unscheduled tasks that can be dragged onto day columns.
- **FR-010**: Dragging a task from the board to the backlog MUST unschedule the task.
- **FR-011**: Each day column MUST have a "+ Add task" affordance at the top.
- **FR-012**: The board MUST support navigating to previous and next weeks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All scheduled tasks appear in the correct day column — 100% accuracy between task scheduled date and column placement.
- **SC-002**: Drag-and-drop reschedule completes within 1 second (card moves and data persists).
- **SC-003**: Task titles, durations, and goal tags are fully visible on cards without truncation.
- **SC-004**: Users can complete the full workflow (view board, drag task to a day, mark complete) in under 10 seconds.
- **SC-005**: The board renders with up to 50 tasks across 7 columns in under 2 seconds.

## Assumptions

- The kanban board replaces the existing FullCalendar time-grid view entirely. The time-grid is removed.
- The week starts from Sunday (matching common US calendar convention) and always shows 7 days.
- Task scheduling via the kanban board sets the scheduledDate field. Time slot assignment (scheduledStart) is optional — cards represent day-level scheduling.
- The existing task.schedule, task.unschedule, and task.getScheduled mutations/queries are reused.
- The edit modal from 010-fix-calendar-view (with prepopulated fields) is retained.
- The "+ Add task" in a day column will not be implemented in this feature — it's a placeholder for future inline task creation.
