# Feature Specification: Fix Calendar UX — Missing Tasks, Layout, Drag & Dark Mode

**Feature Branch**: `006-fix-calendar-ux`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "the calendar part, it is not listing all tasks on a goal, for example a goal has 4 tasks but only 3 are listed on the unscheduled tasks list. also in the calendar today should be on the first column, it's on the last column now. also the item on calendar cannot be drag outside the calendar and put back to the unscheduled tasks. the option right clicking an item on the calendar should not have delete, should only have remove from calendar option. also in dark mode the calendar header and text are all white very hard to see, redo the color"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - All Unscheduled Tasks Appear in Sidebar (Priority: P1)

When a goal has multiple tasks that have not been scheduled, every unscheduled task must appear in the calendar sidebar's "Unscheduled Tasks" list. Currently, some tasks are missing — for example, a goal with 4 tasks only shows 3 in the unscheduled list.

**Why this priority**: Missing tasks means users cannot schedule all their work. This is a data correctness bug that directly blocks task management.

**Independent Test**: Create a goal with 4 tasks (none scheduled). Open the calendar page. All 4 tasks must appear in the sidebar under that goal's section.

**Acceptance Scenarios**:

1. **Given** a goal has 4 unscheduled, active tasks, **When** the user views the calendar sidebar, **Then** all 4 tasks are listed under that goal.
2. **Given** a goal has a mix of scheduled and unscheduled tasks, **When** the user views the sidebar, **Then** only unscheduled tasks appear in the sidebar, and all of them are present.
3. **Given** a task is completed or deleted, **When** the user views the sidebar, **Then** that task does not appear in the unscheduled list.

---

### User Story 2 - Today Is the First Column in Week View (Priority: P1)

The calendar week view should start with today as the first column so the user always sees their current and upcoming days. Currently today appears as the last column, showing mostly past days.

**Why this priority**: The calendar is primarily for planning ahead. Showing past days first wastes screen space and forces users to scroll mentally to find today.

**Independent Test**: Open the calendar in week view on any day. Today's column must be the leftmost column.

**Acceptance Scenarios**:

1. **Given** today is Wednesday, **When** the user opens the calendar week view, **Then** Wednesday is the first (leftmost) column and the view shows Wednesday through the following Tuesday.
2. **Given** today is Monday, **When** the user opens the calendar week view, **Then** Monday is the first column.
3. **Given** today is Sunday, **When** the user opens the calendar week view, **Then** Sunday is the first column.

---

### User Story 3 - Drag Calendar Events Back to Unscheduled (Priority: P1)

Users must be able to drag a scheduled event from the calendar back to the sidebar to unschedule it. Currently, events cannot be dragged outside the calendar grid.

**Why this priority**: Without this, there is no intuitive way to unschedule a task. Users are stuck with tasks on the calendar once placed.

**Independent Test**: Schedule a task by dragging it to the calendar. Then drag that event back to the sidebar area. The task should disappear from the calendar and reappear in the unscheduled sidebar list.

**Acceptance Scenarios**:

1. **Given** a task is scheduled on the calendar, **When** the user drags the event from the calendar grid to the sidebar, **Then** the task is unscheduled and reappears in the sidebar's unscheduled list.
2. **Given** a task is dragged to the sidebar, **When** the drag completes, **Then** the task's scheduled date, time, and duration are cleared.

---

### User Story 4 - Right-Click Menu: "Remove from Calendar" Instead of "Delete" (Priority: P2)

The right-click context menu on calendar events should have a "Remove from Calendar" option instead of "Delete". Removing from calendar unschedules the task (clears its date/time) but keeps it active. It should not soft-delete the task.

**Why this priority**: "Delete" is destructive and confusing — users expect to remove a task from the calendar without losing it entirely. "Remove from Calendar" is the correct semantic action.

**Independent Test**: Right-click a calendar event, select "Remove from Calendar". The event disappears from the calendar and the task reappears in the sidebar's unscheduled list. The task is not deleted.

**Acceptance Scenarios**:

1. **Given** a scheduled task on the calendar, **When** the user right-clicks and selects "Remove from Calendar", **Then** the task is unscheduled (date/time cleared) and reappears in the unscheduled sidebar.
2. **Given** the context menu is open, **When** the user views the options, **Then** there is no "Delete" option — only "Edit", "Reschedule", "Complete" (if not completed), and "Remove from Calendar".
3. **Given** a task was removed from calendar, **When** the user checks the goal's task list, **Then** the task still exists and is active (not deleted).

---

### User Story 5 - Dark Mode Calendar Readability (Priority: P2)

In dark mode, the calendar header text, day labels, time labels, and event text are all white on a white or very light background, making them unreadable. The calendar must use appropriate contrast colors for dark mode.

**Why this priority**: The calendar is unusable in dark mode. While not a data bug, it blocks all dark mode users from using the calendar.

**Independent Test**: Switch to dark mode, open the calendar. All text (headers, day names, time slots, event titles) must be clearly readable against the background.

**Acceptance Scenarios**:

1. **Given** the app is in dark mode, **When** the user views the calendar, **Then** all header text (month/year, navigation buttons) is readable against the dark background.
2. **Given** dark mode is active, **When** the user views the week/day view, **Then** day column headers, time slot labels, and grid lines use appropriate dark-mode colors with sufficient contrast.
3. **Given** dark mode is active, **When** events are displayed, **Then** event text is readable against the event background color.

---

### Edge Cases

- What happens when all tasks for every goal are scheduled? The sidebar should show an "All tasks are scheduled!" message.
- What happens when the user drags an event to the sidebar but drops it outside the designated drop zone? The event should snap back to its original position on the calendar.
- What happens when the user right-clicks a completed task on the calendar? The "Complete" option should not appear (already completed), but "Remove from Calendar" should still be available.
- What happens when the sidebar is empty and the user drags an event toward it? The sidebar should visually indicate it can accept the drop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display every active, non-deleted, non-completed, unscheduled task in the calendar sidebar grouped by goal.
- **FR-002**: System MUST set the calendar week view to start with today's date as the first column.
- **FR-003**: System MUST allow users to drag calendar events from the calendar grid to the sidebar to unschedule them.
- **FR-004**: When a task is unscheduled (via drag or menu), the system MUST clear the task's scheduled date, start time, and duration.
- **FR-005**: The calendar event right-click context menu MUST include "Remove from Calendar" instead of "Delete".
- **FR-006**: "Remove from Calendar" MUST unschedule the task without deleting it.
- **FR-007**: System MUST provide readable text contrast for all calendar elements in dark mode (minimum WCAG AA contrast ratio).
- **FR-008**: The sidebar MUST visually indicate when it can accept a dragged event (drop zone highlight).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of active unscheduled tasks appear in the sidebar — zero missing tasks regardless of goal size.
- **SC-002**: Today is always the first column in week view, verified across all 7 days of the week.
- **SC-003**: Users can unschedule a task via drag-to-sidebar in under 3 seconds (single drag action).
- **SC-004**: The context menu contains zero destructive "Delete" options — only "Remove from Calendar" for unscheduling.
- **SC-005**: All calendar text elements pass WCAG AA contrast ratio (4.5:1 for normal text) in dark mode.

## Assumptions

- The calendar sidebar and calendar grid are on the same page and visible simultaneously.
- "Unscheduled" means the task has no scheduledDate set (null/empty).
- The existing drag-and-drop infrastructure from the calendar library supports external drop targets with configuration.
- Dark mode is toggled via an existing system/app-level mechanism (prefers-color-scheme or manual toggle).
- The "Reschedule" option in the context menu remains and opens the edit modal for changing date/time.
