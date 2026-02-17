# Feature Specification: Inbox AI Chat & Calendar Fixes

**Feature Branch**: `004-inbox-ai-calendar-fix`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Inbox items should open an AI-powered chat experience for brainstorming and goal/task generation. Calendar page needs fixes: missing tasks, no right-click editing, ugly colors, wrong week start day."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inbox AI Chat Experience (Priority: P1)

When a user double-clicks an inbox item, a modal opens with an AI-powered chat interface. The user can have a back-and-forth conversation with AI to brainstorm, expand ideas, challenge limiting beliefs, and get realistic guidance. The AI helps the user think through their thought — asking clarifying questions, exploring possibilities, and aligning the idea with personal growth. Once the user feels ready, they can ask the AI to suggest goals, tasks, or subtasks. The user reviews the AI suggestions and can accept, modify, or reject each one. Accepted goals and tasks are created in the system.

**Why this priority**: This is the core value proposition of the inbox — it transforms raw thoughts into actionable, well-considered goals and tasks through AI collaboration. Without this, the inbox is just a text list.

**Independent Test**: Double-click an inbox item → AI chat modal opens with the item's text as context → type a message → AI responds conversationally → after several exchanges, ask AI to suggest goals → AI proposes structured goals with tasks → accept a goal → goal appears on dashboard with tasks.

**Acceptance Scenarios**:

1. **Given** an inbox item exists, **When** user double-clicks it, **Then** a modal opens showing the item text and an AI chat interface with a message input
2. **Given** the AI chat modal is open, **When** user types a message and sends it, **Then** AI responds conversationally with the inbox item as context, helping brainstorm and expand the idea
3. **Given** an ongoing AI conversation, **When** user asks AI to suggest goals, **Then** AI generates structured goal suggestions with titles, purposes, and potential tasks/subtasks
4. **Given** AI has suggested goals, **When** user accepts a suggestion, **Then** the system creates the goal (and its tasks) and the user can see it on the dashboard
5. **Given** AI has suggested goals, **When** user modifies a suggestion before accepting, **Then** the modified version is created
6. **Given** AI has suggested goals, **When** user rejects a suggestion, **Then** it is removed from the suggestion list without creating anything
7. **Given** the AI chat modal is open, **When** user presses Escape or clicks outside, **Then** the modal closes and the conversation is preserved for that inbox item
8. **Given** a previous AI conversation exists for an inbox item, **When** user double-clicks the same item again, **Then** the previous conversation is restored

---

### User Story 2 - Calendar: Show All Tasks from All Goals (Priority: P1)

The calendar view currently only shows tasks that have been explicitly scheduled (have a `scheduledDate`). Users expect to see all active tasks from all their goals on the calendar. Tasks without a scheduled date should appear in the sidebar as unscheduled, and the calendar should reliably display every scheduled task from every goal without missing any.

**Why this priority**: Missing tasks on the calendar makes it unreliable for planning. Users lose trust in the system if tasks disappear.

**Independent Test**: Create 3 goals with 2 tasks each, schedule all tasks → navigate to calendar → all 6 tasks appear on the calendar. Create an unscheduled task → it appears in the sidebar.

**Acceptance Scenarios**:

1. **Given** multiple goals each with scheduled tasks, **When** user views the calendar, **Then** all scheduled tasks from all goals are displayed
2. **Given** tasks without a scheduled date, **When** user views the calendar, **Then** unscheduled tasks appear in the sidebar grouped by goal
3. **Given** a task is newly created under a goal, **When** user navigates to calendar, **Then** the task appears either on the calendar (if scheduled) or in the sidebar (if unscheduled)

---

### User Story 3 - Calendar: Right-Click Context Menu on Events (Priority: P2)

Users need to be able to right-click on calendar events to access quick actions: edit task details, reschedule, mark as complete, or delete. Currently there is no right-click interaction on calendar events.

**Why this priority**: Without right-click editing, users must navigate away from the calendar to make changes, breaking their planning flow.

**Independent Test**: Right-click a calendar event → context menu appears with options (Edit, Reschedule, Complete, Delete) → select Edit → task detail modal opens for editing.

**Acceptance Scenarios**:

1. **Given** a task event on the calendar, **When** user right-clicks it, **Then** a context menu appears with options: Edit, Reschedule, Complete, Delete
2. **Given** the context menu is open, **When** user clicks "Edit", **Then** a modal opens showing the task details with editable fields (title, description, scheduled date/time, duration)
3. **Given** the context menu is open, **When** user clicks "Complete", **Then** the task is marked as completed and visually updated on the calendar
4. **Given** the context menu is open, **When** user clicks "Delete", **Then** the task is soft-deleted with an undo toast (5-second window)
5. **Given** the context menu is open, **When** user clicks "Reschedule", **Then** a date/time picker appears to set a new scheduled date

---

### User Story 4 - Calendar: Goal-Based Color Coding (Priority: P2)

Calendar events should be color-coded by goal so users can quickly distinguish which tasks belong to which goal. Each goal gets a distinct color from a predefined palette. The current two-color scheme (completed vs active) is insufficient.

**Why this priority**: Visual differentiation by goal makes the calendar scannable and helps users balance time across goals.

**Independent Test**: Create 3 goals with different tasks scheduled → view calendar → each goal's tasks have a distinct color → completed tasks show a muted/strikethrough variant of their goal color.

**Acceptance Scenarios**:

1. **Given** tasks from multiple goals on the calendar, **When** user views the calendar, **Then** each goal's tasks are displayed in a distinct color from a predefined palette
2. **Given** a completed task on the calendar, **When** user views it, **Then** it displays in a muted/faded variant of its goal color with strikethrough text
3. **Given** a new goal is created, **When** its tasks appear on the calendar, **Then** it automatically receives the next available color from the palette
4. **Given** the calendar sidebar, **When** user views unscheduled tasks, **Then** they are color-coded to match their goal's calendar color

---

### User Story 5 - Calendar: Monday as First Day of Week (Priority: P2)

The calendar week view should start on Monday, not Sunday. Monday should always be the first column in the week view. This aligns with ISO 8601 and most planning conventions.

**Why this priority**: Starting on Sunday is disorienting for users who plan their week Monday-to-Friday. This is a simple but important usability fix.

**Independent Test**: Open calendar in week view → Monday is the first column → Sunday is the last column.

**Acceptance Scenarios**:

1. **Given** the calendar is in week view, **When** user views it, **Then** Monday is the first column and Sunday is the last column
2. **Given** the calendar week navigation, **When** user clicks "next week", **Then** the view advances to the next Monday-to-Sunday period

---

### User Story 6 - Inbox Item Conversion to Goal/Task/Subtask (Priority: P1)

Beyond the AI chat experience, users need a quick way to directly convert an inbox item into a goal, a task under an existing goal, or a subtask under an existing task — without going through the full AI chat. The right-click context menu on inbox items should offer these conversion options.

**Why this priority**: Not every inbox item needs AI brainstorming. Some are already clear actionable items that just need to be filed in the right place.

**Independent Test**: Right-click an inbox item → select "Convert to Goal" → a new goal is created with the item's text as the title → item is removed from inbox. Right-click another item → "Convert to Task" → select a goal → task is created under that goal.

**Acceptance Scenarios**:

1. **Given** an inbox item, **When** user right-clicks and selects "Convert to Goal", **Then** a new goal is created with the item's title, and the item is removed from the inbox
2. **Given** an inbox item, **When** user right-clicks and selects "Convert to Task", **Then** a goal picker appears, user selects a goal, and a new task is created under that goal with the item's title
3. **Given** an inbox item, **When** user right-clicks and selects "Convert to Subtask", **Then** a goal picker appears, then a task picker for the selected goal, and a subtask is created under the chosen task
4. **Given** an inbox item is converted, **When** the conversion completes, **Then** the inbox item is soft-deleted (removed from inbox view)

---

### Edge Cases

- What happens when the AI service is unavailable during chat? System shows an error message in the chat and allows retry.
- What happens when the user closes the AI chat modal mid-conversation? Conversation is preserved and restored on next open.
- What happens when a goal color palette is exhausted (more goals than colors)? Colors cycle/repeat from the beginning of the palette.
- What happens when a user tries to convert an inbox item to a subtask but no goals or tasks exist? System shows a helpful message suggesting to create a goal first.
- What happens when the AI suggests a goal that duplicates an existing one? System shows existing goals for comparison and lets user decide.
- What happens when the calendar has no scheduled tasks? Calendar shows empty state with a prompt to schedule tasks from the sidebar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an AI chat interface within the inbox item detail modal, supporting multi-turn conversation with message history
- **FR-002**: AI MUST use the inbox item's text as initial context for the conversation
- **FR-003**: AI MUST be capable of brainstorming, expanding ideas, challenging limiting beliefs, suggesting realistic approaches, and aligning ideas with personal growth
- **FR-004**: AI MUST be able to generate structured goal suggestions with title, purpose, and task breakdowns when the user requests it
- **FR-005**: Users MUST be able to accept, modify, or reject each AI-generated goal/task suggestion individually
- **FR-006**: Accepted AI suggestions MUST create actual goals and tasks in the system
- **FR-007**: AI conversation history MUST be preserved per inbox item and restored when reopening
- **FR-008**: AI responses MUST stream in real-time (token by token) for a responsive experience
- **FR-009**: Calendar MUST display all scheduled tasks from all active goals within the visible date range
- **FR-010**: Calendar sidebar MUST show all unscheduled tasks from all active goals, grouped by goal
- **FR-011**: Calendar events MUST support right-click context menu with Edit, Reschedule, Complete, and Delete actions
- **FR-012**: Calendar events MUST be color-coded by goal using a predefined color palette of at least 8 distinct colors
- **FR-013**: Calendar week view MUST start on Monday (first column) and end on Sunday (last column)
- **FR-014**: Inbox item right-click context menu MUST include options to convert to Goal, Task, or Subtask
- **FR-015**: Converting an inbox item to a task MUST present a goal picker; converting to a subtask MUST present both a goal picker and a task picker
- **FR-016**: Completed calendar tasks MUST display in a muted/faded variant of their goal color
- **FR-017**: Task edit modal from calendar MUST allow editing title, description, scheduled date/time, and duration
- **FR-018**: Calendar task deletion MUST use the soft-delete pattern with 5-second undo toast

### Key Entities

- **Conversation**: Represents an AI chat session tied to an inbox item. Contains message history (role, content, timestamp). One conversation per inbox item.
- **ConversationMessage**: Individual message within a conversation. Has role (user or assistant), content text, and timestamp.
- **AISuggestion**: A structured suggestion from AI containing a proposed goal title, purpose, and list of proposed tasks. Can be in state: pending, accepted, modified, or rejected.
- **GoalColor**: Association between a goal and a color from the palette. Assigned automatically on goal creation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can go from raw inbox thought to created goal with tasks in under 5 minutes using AI chat
- **SC-002**: 100% of scheduled tasks from all goals are visible on the calendar (zero missing tasks)
- **SC-003**: Users can edit any calendar task via right-click without leaving the calendar page
- **SC-004**: Users can visually distinguish tasks from different goals on the calendar at a glance
- **SC-005**: Calendar week view consistently starts on Monday across all navigation actions
- **SC-006**: AI conversation history is fully preserved across modal close/reopen cycles
- **SC-007**: Users can convert inbox items to goals, tasks, or subtasks in under 10 seconds via right-click menu

## Assumptions

- The existing Vercel AI SDK + Gemini 2.0 Flash integration will be extended for streaming chat (currently used for one-shot generation)
- Conversation history is stored locally in the database (not in external AI service memory)
- The color palette is hardcoded (not user-customizable) with at least 8 visually distinct colors that work on both light and dark backgrounds
- Subtask support assumes the existing task model can represent parent-child relationships (tasks with a parentTaskId)
- The calendar uses FullCalendar library which supports Monday-first weeks via configuration
