# Research: Fix Calendar UX

## Decision 1: FullCalendar firstDay for "today starts the week"

**Decision**: Use `firstDay` set to `new Date().getDay()` dynamically so the week always starts on today's day of the week.

**Rationale**: FullCalendar's `firstDay` option accepts 0-6 (Sun-Sat). Setting it to `new Date().getDay()` makes today the leftmost column. Combined with an explicit `initialDate`, this ensures the view always starts on today.

**Alternatives considered**:
- Using `visibleRange` with custom date logic — more complex, not needed for timeGridWeek
- Using `initialDate` alone — doesn't change which day is the first column, only which week is shown

## Decision 2: Drag events out of calendar to unschedule

**Decision**: Use FullCalendar's `eventDragStop` callback to detect when an event is dropped outside the calendar grid (over the sidebar). Check if the mouse position intersects the sidebar element using `getBoundingClientRect()`, then call `task.unschedule`.

**Rationale**: `eventDragStop` fires after any event drag ends, even when the event is dropped outside the calendar. By checking the mouse coordinates against the sidebar's bounding rect, we can determine if the user intended to "return" the task to unscheduled. We also need to call `event.remove()` or revert the event after unscheduling.

**Alternatives considered**:
- Using FullCalendar's `eventLeave` — only works with linked external calendars, not arbitrary DOM elements
- HTML5 drag/drop API on the sidebar as a drop zone — conflicts with FullCalendar's internal drag system

## Decision 3: Dark mode FullCalendar styling

**Decision**: Add CSS overrides in globals.css targeting `.dark .fc-*` selectors to set background, text, and border colors using the existing CSS variables.

**Rationale**: FullCalendar uses its own CSS classes (`.fc-toolbar`, `.fc-col-header-cell`, `.fc-timegrid-slot`, etc.) with hardcoded light-mode colors. Overriding them in the global stylesheet using the `.dark` parent class is the simplest approach that doesn't require FullCalendar theme configuration.

**Alternatives considered**:
- FullCalendar Bootstrap/custom theme — heavyweight, adds a dependency
- Inline styles via `eventContent` render prop — only affects events, not the grid/headers

## Decision 4: Missing tasks root cause

**Decision**: Investigate the `goal.list` query's task filtering and the sidebar component's filter logic. The issue is likely that tasks created via inbox conversion (feature 004) may have `parentTaskId` set or incorrect `status` values, causing them to be filtered out unexpectedly. Also verify there's no LIMIT clause or pagination truncating results.

**Rationale**: The sidebar filter `!t.scheduledDate && !t.deletedAt && t.status !== "completed" && t.status !== "skipped"` is correct on paper. The goal.list router returns all non-deleted tasks. The bug may be in the data itself (a task with scheduledDate set to empty string instead of null) or in how tasks were created.

**Alternatives considered**: N/A — this is a debugging decision, not an architectural one.
