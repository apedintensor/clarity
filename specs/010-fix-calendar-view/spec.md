# Feature Specification: Fix Calendar View

**Feature Branch**: `010-fix-calendar-view`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Calendar view is too narrow to read scheduled tasks. Edit task modal opens empty instead of prepopulated. Scheduling should start from now, and unfinished tasks should be pushed forward. Improve the calendar interface inspired by Sunsama's layout."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prepopulate Edit Task Modal (Priority: P1)

When the user double-clicks on a scheduled task in the calendar, the Edit Task modal opens with all fields prepopulated: title, description, date, time, scheduled duration, estimated minutes, and status. The user can modify any field and save changes. Currently the modal opens with empty fields, making editing impossible without re-entering all information from scratch.

**Why this priority**: This is a critical usability bug — the edit modal is completely non-functional without prepopulated data. Users cannot edit scheduled tasks at all.

**Independent Test**: Schedule a task on the calendar. Double-click it. The Edit Task modal opens with the task's title, description, date, time, duration, and status all prefilled. Modify the title and save. Verify the calendar event reflects the updated title.

**Acceptance Scenarios**:

1. **Given** a task is scheduled on the calendar, **When** the user double-clicks it, **Then** the Edit Task modal opens with all fields prepopulated from the task's existing data (title, description, date, time, duration, estimated minutes, status).
2. **Given** the Edit Task modal is open with prepopulated data, **When** the user modifies the title and clicks Save, **Then** the task updates on the calendar with the new title.
3. **Given** the Edit Task modal is open, **When** the user changes the scheduled time and saves, **Then** the calendar event moves to the new time slot.
4. **Given** the Edit Task modal is open, **When** the user clicks Cancel, **Then** no changes are saved and the modal closes.

---

### User Story 2 - Resizable Calendar Columns (Priority: P2)

The calendar's day columns are too narrow to read task titles and time details. The user needs to be able to expand columns to see full task information. The user can use mouse scroll (without modifier keys) to zoom in/out on the calendar's time axis, making time slots taller or shorter. The column width adjusts proportionally so task text remains readable. The calendar should default to showing a comfortable reading size where task titles are fully visible.

**Why this priority**: The calendar is the primary scheduling interface, and if users can't read what's scheduled, the entire scheduling feature loses value.

**Independent Test**: Open the calendar with several scheduled tasks. Task titles should be readable at default zoom. Scroll up to zoom in (taller time slots, wider columns). Scroll down to zoom out. The calendar smoothly adjusts and task text remains readable at all zoom levels.

**Acceptance Scenarios**:

1. **Given** the calendar is displayed with scheduled tasks, **When** the user views the calendar at default zoom, **Then** task titles and time ranges are readable without truncation for tasks 30 minutes or longer.
2. **Given** the calendar is displayed, **When** the user scrolls up, **Then** the calendar zooms in — time slots become taller and column width increases.
3. **Given** the calendar is displayed, **When** the user scrolls down, **Then** the calendar zooms out — time slots become shorter and column width decreases.
4. **Given** the calendar is zoomed in, **When** the user switches between week and day view, **Then** the zoom level is preserved.

---

### User Story 3 - Auto-Reschedule Unfinished Tasks (Priority: P3)

When the user opens the calendar, any tasks from past time slots that were not marked as completed are automatically rescheduled to start from the current time going forward. This prevents the calendar from showing stale events in the past that the user missed. If the user did not click "finish" (complete) on a task, it moves forward to the next available time slot from now. This keeps the calendar always actionable and forward-looking.

**Why this priority**: Without auto-rescheduling, the calendar becomes cluttered with past incomplete tasks and loses its value as a planning tool for the rest of the day.

**Independent Test**: Schedule 3 tasks starting at 9 AM. Let time pass to 11 AM without completing any. Open the calendar. The 3 tasks should now be rescheduled starting from 11:00 AM (next available slot from now), stacked sequentially.

**Acceptance Scenarios**:

1. **Given** the user has tasks scheduled for time slots that have already passed, **When** the calendar loads, **Then** incomplete tasks (status not "completed") are rescheduled to start from the next available 30-minute slot from the current time.
2. **Given** a task was scheduled for 9:00 AM and it's now 11:00 AM, **When** the calendar loads, **Then** that task appears at 11:00 AM (or the next free slot), not at 9:00 AM.
3. **Given** multiple past tasks need rescheduling, **When** the calendar loads, **Then** they are stacked sequentially from the current time, maintaining their relative order.
4. **Given** a task was already completed (status = "completed"), **When** the calendar loads, **Then** that task stays at its original scheduled time and is NOT rescheduled.
5. **Given** tasks are rescheduled forward, **When** there are existing future tasks on the calendar, **Then** the rescheduled tasks do not overlap with existing future tasks.

---

### User Story 4 - Sunsama-Inspired Task List Panel (Priority: P4)

The calendar page gains a task list panel on the left side, similar to Sunsama's layout. This panel shows today's tasks as cards with: task title, estimated duration, goal/category tag, and completion status. Unscheduled tasks appear in the panel as a backlog that the user can drag onto the calendar. Scheduled tasks show their assigned time. This gives users an at-a-glance view of their day alongside the time-based calendar view.

**Why this priority**: This is an enhancement that improves the overall planning experience by combining list and calendar views, but the core calendar must work correctly first (US1-US3).

**Independent Test**: Navigate to the Calendar page. A task list panel appears on the left showing today's planned tasks. Each task card shows title, duration, and goal tag. Drag an unscheduled task from the panel onto the calendar to schedule it.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Calendar page, **When** the page loads, **Then** a task list panel is visible on the left side alongside the calendar.
2. **Given** the task list panel is visible, **When** the user views today's tasks, **Then** each task shows its title, estimated duration, and parent goal name.
3. **Given** unscheduled tasks exist in the panel, **When** the user drags a task onto the calendar, **Then** the task is scheduled at the dropped time slot.
4. **Given** a task is already scheduled, **When** the user views it in the panel, **Then** it shows the scheduled time alongside its title.
5. **Given** a task is completed, **When** the user views the panel, **Then** the task shows a completion indicator (checkmark or strikethrough).

---

### Edge Cases

- What happens when all tasks are completed? The calendar shows completed events at their original times with a visual "done" indicator. The task panel shows all tasks as complete.
- What happens when there's no room to reschedule past tasks (rest of day is full)? Tasks are rescheduled into the next available slots, even if they extend past the typical work day. A warning appears if tasks push past 6 PM.
- What happens when the user manually reschedules a task that was auto-rescheduled? The manual placement takes priority and the task stays at the new time.
- What happens when the calendar has no scheduled tasks? The calendar shows empty time slots and the task panel shows unscheduled tasks available for planning.
- What happens on page refresh after zoom? The zoom level resets to the default comfortable reading size.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Edit Task modal MUST prepopulate all fields (title, description, date, time, duration, estimated minutes, status) from the selected task's existing data.
- **FR-002**: The calendar MUST support scroll-to-zoom that adjusts time slot height and column width.
- **FR-003**: The default calendar zoom level MUST display task titles readable without truncation for events 30 minutes or longer.
- **FR-004**: Incomplete tasks scheduled in past time slots MUST be automatically rescheduled to start from the current time when the calendar loads.
- **FR-005**: Completed tasks MUST NOT be rescheduled — they remain at their original scheduled time.
- **FR-006**: Auto-rescheduled tasks MUST NOT overlap with existing future scheduled tasks.
- **FR-007**: The Calendar page MUST display a task list panel alongside the calendar view.
- **FR-008**: The task list panel MUST show each task's title, estimated duration, and parent goal name.
- **FR-009**: Users MUST be able to drag unscheduled tasks from the panel onto the calendar to schedule them.
- **FR-010**: The scroll zoom MUST work without modifier keys (plain scroll zooms the calendar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Edit Task modal fields are prepopulated when opening an existing task — zero empty fields for tasks that have data.
- **SC-002**: Task titles are fully visible (not truncated) at default zoom for events 30 minutes or longer.
- **SC-003**: Zoom in/out responds within 100ms of scroll input — smooth, lag-free experience.
- **SC-004**: Incomplete past tasks are rescheduled within 1 second of calendar load.
- **SC-005**: Users can drag a task from the panel to the calendar and see it scheduled in under 3 seconds.

## Assumptions

- The existing Ctrl/Cmd+scroll zoom behavior is replaced by plain scroll zoom (no modifier key needed) since the calendar is the primary content on the page.
- Auto-rescheduling only applies to today's incomplete tasks — past days' tasks are not moved.
- The task list panel shows tasks from the current day's daily plan (if confirmed) or all active tasks (if no plan confirmed).
- Column width scaling is proportional to zoom level — zooming in makes both time slots taller AND columns wider.
- The 30-minute time slot granularity for scheduling is maintained.
