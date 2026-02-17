# Feature Specification: Calendar & AI Chat Polish

**Feature Branch**: `007-calendar-chat-polish`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Calendar UX polish (resize columns, zoom, double-click edit, drag performance) and AI chat improvements (expandable input, web search, individual suggestion accept, editable modify)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Individual Goal Suggestion Accept/Reject (Priority: P1)

When the AI suggests multiple goals in the brainstorm chat, each suggestion card must be independently acceptable or rejectable. Currently, accepting one goal removes all suggestions from the view and only creates that single goal. Each suggestion should remain visible and actionable until the user explicitly accepts or rejects it. The inbox brainstorm item should only be marked as done manually by the user, not automatically when a suggestion is accepted.

**Why this priority**: This is a data loss bug — users lose access to other AI suggestions when they accept just one. It breaks the core brainstorming workflow.

**Independent Test**: Start a brainstorm chat, ask the AI to suggest goals. It suggests 3. Accept goal #1 — goals #2 and #3 should still be visible with their Accept/Reject buttons. Accept goal #2. Goal #3 remains. The inbox item stays active until the user manually marks it done.

**Acceptance Scenarios**:

1. **Given** the AI has suggested 3 goals, **When** the user accepts one, **Then** only that goal is created and the other 2 suggestions remain visible and actionable.
2. **Given** a user has accepted 2 of 3 suggestions, **When** they reject the 3rd, **Then** it disappears but the accepted goals remain created.
3. **Given** a user has accepted suggestions, **When** they check the inbox, **Then** the brainstorm item is still active (not automatically marked done).
4. **Given** a user wants to finish with the brainstorm item, **When** they manually mark it as done, **Then** it moves to the completed/archived state.

---

### User Story 2 - Editable Tasks in Modify Mode (Priority: P1)

When the AI suggests a goal and the user clicks "Modify", the task list within the suggestion must be editable. Users should be able to change task titles, descriptions, estimated durations, add new tasks, or remove tasks before accepting the modified suggestion.

**Why this priority**: Without editable tasks in modify mode, the "Modify" button is non-functional, making it useless.

**Independent Test**: AI suggests a goal with 4 tasks. Click "Modify". Edit task #2's title, change task #3's duration, remove task #4, add a new task #5. Click "Accept". The goal is created with the modified task list.

**Acceptance Scenarios**:

1. **Given** a suggestion is in modify mode, **When** the user edits a task title, **Then** the change is reflected in the suggestion.
2. **Given** modify mode, **When** the user changes a task's estimated duration, **Then** the new duration is saved.
3. **Given** modify mode, **When** the user removes a task, **Then** it is removed from the list.
4. **Given** modify mode, **When** the user adds a new task, **Then** it appears in the list with default values.
5. **Given** a modified suggestion, **When** the user clicks Accept, **Then** the goal is created with all modifications applied.

---

### User Story 3 - Double-Click Calendar Event to Edit Details (Priority: P1)

When the user double-clicks a calendar event, a detail/edit modal should open showing the task's full details (title, description, date, time, duration, estimated minutes, status). The user can edit these fields and save. Currently, clicking an event prompts to mark it as done, which is the wrong behavior for a double-click.

**Why this priority**: Double-click to edit is a standard UX pattern. The current "mark as done" on click is confusing and destructive.

**Independent Test**: Double-click a calendar event. The edit modal opens showing all task details. Change the duration from 30min to 45min. Save. The event on the calendar updates to reflect the new duration.

**Acceptance Scenarios**:

1. **Given** a scheduled task on the calendar, **When** the user double-clicks it, **Then** an edit modal opens with the task's details (title, description, date, time, duration).
2. **Given** the edit modal is open, **When** the user changes the duration and saves, **Then** the calendar event updates to reflect the new duration.
3. **Given** a single click on a calendar event, **When** the click completes, **Then** no action is taken (no "mark as done" prompt).

---

### User Story 4 - Expandable Chat Input Box (Priority: P2)

The brainstorm chat input box should expand vertically as the user types longer messages, growing from a single line to show the full message content. It should expand up to a maximum height (roughly 6 lines), then scroll internally. The expansion should not push the chat history off screen.

**Why this priority**: A single-line input is too small for meaningful brainstorming. Users need to see their full message as they compose it.

**Independent Test**: Open the brainstorm chat. Start typing a long message (4+ lines). The input box grows to accommodate the text. At 6+ lines, it stops growing and scrolls internally.

**Acceptance Scenarios**:

1. **Given** the chat input is empty, **When** the user starts typing, **Then** the input starts as a single line.
2. **Given** the user types a message that wraps to 3 lines, **When** they continue typing, **Then** the input expands to show all 3 lines.
3. **Given** the user has typed 8+ lines, **When** they view the input, **Then** it shows the maximum height (approximately 6 lines) and the content scrolls internally.
4. **Given** the input has expanded, **When** the user deletes text back to 1 line, **Then** the input shrinks back to its minimum size.

---

### User Story 5 - AI Web Search in Brainstorm Chat (Priority: P2)

When the user asks the AI to search for information online during a brainstorm session, the AI should be able to perform web searches and incorporate the results into its response. For example, "search for the best beginner Spanish learning apps" should trigger a web search and return relevant findings.

**Why this priority**: Web search elevates the AI from a static brainstorming partner to a research assistant, making the brainstorm sessions significantly more valuable.

**Independent Test**: Open a brainstorm chat. Type "search online for the top 5 productivity frameworks". The AI performs a web search and responds with real, current information from the web.

**Acceptance Scenarios**:

1. **Given** a brainstorm chat is open, **When** the user asks the AI to "search online for X", **Then** the AI performs a web search and includes results in its response.
2. **Given** the AI searches the web, **When** results are returned, **Then** the response includes source attributions or references.
3. **Given** the web search fails or returns no results, **When** the AI responds, **Then** it acknowledges the search failed and continues the conversation without search results.

---

### User Story 6 - Calendar Zoom with Mouse Scroll (Priority: P2)

Users should be able to zoom in and out of the calendar time grid using mouse scroll (with a modifier key like Ctrl/Cmd). Zooming in shows wider time slots for more detail; zooming out shows more hours in a compact view.

**Why this priority**: Fixed-size time slots don't suit all use cases. Users with many short tasks need to zoom in; those planning a full day need to zoom out.

**Independent Test**: Open the calendar. Hold Ctrl and scroll up — time slots get taller (zoom in). Hold Ctrl and scroll down — time slots get shorter (zoom out).

**Acceptance Scenarios**:

1. **Given** the calendar is in week view, **When** the user holds Ctrl and scrolls up, **Then** the time slots become taller (zoomed in).
2. **Given** the calendar is zoomed in, **When** the user holds Ctrl and scrolls down, **Then** the time slots become shorter (zoomed out).
3. **Given** normal scrolling (no Ctrl), **When** the user scrolls, **Then** the calendar scrolls normally (no zoom).

---

### User Story 7 - Optimized Calendar Drag Performance (Priority: P2)

Calendar event dragging should feel instantaneous and responsive. Currently there is noticeable lag when dragging events. The drag feedback (ghost element, position update) must be smooth with no visible delay.

**Why this priority**: Laggy drag-and-drop undermines the entire calendar scheduling experience.

**Independent Test**: Drag a calendar event to a new time slot. The event should follow the cursor smoothly with no perceptible delay.

**Acceptance Scenarios**:

1. **Given** a calendar event, **When** the user starts dragging, **Then** the drag feedback appears within 50ms.
2. **Given** an event is being dragged, **When** the user moves the cursor, **Then** the event ghost follows the cursor smoothly without jittering or lag.

---

### Edge Cases

- What happens when the user tries to zoom past the minimum/maximum slot height? The zoom should stop at reasonable bounds (e.g., 15min minimum slot height, 2-hour maximum).
- What happens when the AI web search takes a long time? A loading indicator should show while searching, and the AI should indicate it's searching before results arrive.
- What happens when the user modifies a suggestion and then clicks "Reject" instead of "Accept"? The modifications are discarded and the suggestion is dismissed.
- What happens when the chat input expands and the chat history is very short? The chat area should not shrink below a minimum height.
- What happens when the user double-clicks a completed event on the calendar? The edit modal should still open (allowing reschedule or status change).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each AI goal suggestion MUST be independently acceptable — accepting one MUST NOT dismiss others.
- **FR-002**: Rejecting a suggestion MUST only dismiss that specific suggestion.
- **FR-003**: The inbox brainstorm item MUST remain active until the user manually marks it done.
- **FR-004**: The "Modify" button on a suggestion MUST make all task fields editable (title, description, duration).
- **FR-005**: Users MUST be able to add and remove tasks in modify mode before accepting.
- **FR-006**: Double-clicking a calendar event MUST open an edit modal showing task details.
- **FR-007**: Single-clicking a calendar event MUST NOT trigger any action (no "mark as done" prompt).
- **FR-008**: The chat input MUST expand vertically as the user types, up to a maximum of approximately 6 lines.
- **FR-009**: The chat input MUST shrink back when text is deleted.
- **FR-010**: The AI MUST be able to perform web searches when the user requests online research.
- **FR-011**: Web search results MUST include source references.
- **FR-012**: Calendar MUST support zoom in/out via Ctrl+scroll to adjust time slot height.
- **FR-013**: Calendar drag operations MUST provide visual feedback within 50ms of drag initiation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can accept/reject each AI suggestion independently — 100% of suggestions remain visible after accepting a sibling.
- **SC-002**: Users can edit all task fields in modify mode and create goals with modifications — 100% of edits persist through accept.
- **SC-003**: Double-click on a calendar event opens the edit modal within 200ms — no "mark as done" prompt on any click.
- **SC-004**: Chat input expands from 1 line to up to 6 lines as user types, with smooth resizing.
- **SC-005**: AI web search returns relevant results within 10 seconds when requested.
- **SC-006**: Calendar drag operations feel smooth with no perceptible lag (feedback within 50ms).

## Assumptions

- The existing edit modal (CalendarTaskEditModal) can be reused for double-click editing.
- Web search will use the AI provider's built-in search/grounding capabilities.
- Calendar zoom will adjust FullCalendar's `slotMinTime`/`slotMaxTime` or slot height CSS.
- The "Modify" mode will be an inline editing state on the suggestion card component.
- Drag performance improvement is primarily about optimistic UI updates and reducing unnecessary re-renders.
- The single-click "mark as done" prompt is replaced by double-click edit; marking done is available via right-click context menu.
