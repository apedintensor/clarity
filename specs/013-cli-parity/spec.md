# Feature Specification: CLI Parity

**Feature Branch**: `013-cli-parity`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Add missing CLI commands for inbox, scheduling, and daily planning to match web dashboard features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inbox Management from CLI (Priority: P1)

The user can manage their inbox entirely from the terminal. They can add new items to the inbox with `clarity inbox add "item text"`, list unprocessed items with `clarity inbox`, and convert an inbox item to a goal or assign it to an existing goal with `clarity inbox convert <id> --to goal` or `clarity inbox assign <id> --goal <goalId>`. They can also delete inbox items with `clarity inbox delete <id>`.

**Why this priority**: The inbox is the primary capture mechanism in the web dashboard, replacing the older braindump flow. Without CLI inbox support, terminal users cannot capture and triage items the same way web users do.

**Independent Test**: Run `clarity inbox add "Buy groceries"`. Then run `clarity inbox` and see the new item listed. Run `clarity inbox convert <id> --to goal` and confirm the item becomes a goal.

**Acceptance Scenarios**:

1. **Given** the user is in the terminal, **When** they run `clarity inbox add "Meeting notes"`, **Then** a new inbox item is created and a confirmation message is shown with the item ID.
2. **Given** unprocessed inbox items exist, **When** the user runs `clarity inbox`, **Then** a numbered list of items is displayed showing ID, title, and creation date.
3. **Given** an inbox item exists, **When** the user runs `clarity inbox convert <id> --to goal`, **Then** the item is converted into a new goal and the goal details are shown.
4. **Given** an inbox item exists and goals exist, **When** the user runs `clarity inbox assign <id> --goal <goalId>`, **Then** the item is converted into a task under the specified goal.
5. **Given** an inbox item exists, **When** the user runs `clarity inbox delete <id>`, **Then** the item is soft-deleted and a confirmation is shown.

---

### User Story 2 - Task Scheduling from CLI (Priority: P2)

The user can schedule and unschedule tasks from the terminal. They can schedule a task to a specific date with `clarity schedule <taskId> --date 2026-02-20` and optionally set a time and duration. They can view what's scheduled for a date range with `clarity calendar` (defaults to current week). They can unschedule a task with `clarity unschedule <taskId>`.

**Why this priority**: The web kanban board provides full scheduling capability. CLI users need to be able to schedule tasks to dates so both interfaces stay in sync.

**Independent Test**: Run `clarity schedule <taskId> --date 2026-02-20`. Then run `clarity calendar` and see the task listed under February 20.

**Acceptance Scenarios**:

1. **Given** a task exists, **When** the user runs `clarity schedule <taskId> --date 2026-02-20`, **Then** the task is scheduled for that date and a confirmation is shown.
2. **Given** a task exists, **When** the user runs `clarity schedule <taskId> --date 2026-02-20 --time 14:30 --duration 60`, **Then** the task is scheduled with the specified date, start time, and duration.
3. **Given** tasks are scheduled for the current week, **When** the user runs `clarity calendar`, **Then** a day-by-day listing of scheduled tasks is shown for the current week (7 days starting from Sunday).
4. **Given** the user wants to see a different week, **When** they run `clarity calendar --date 2026-03-01`, **Then** the week containing that date is shown.
5. **Given** a scheduled task exists, **When** the user runs `clarity unschedule <taskId>`, **Then** the task's schedule is cleared and a confirmation is shown.

---

### User Story 3 - Daily Planning from CLI (Priority: P3)

The user can start their daily planning session from the terminal. Running `clarity plan` begins an interactive planning flow: it shows yesterday's unfinished tasks, presents today's available tasks grouped by goal, and lets the user select which tasks to work on today by entering task numbers. The plan is then confirmed and a summary is shown.

**Why this priority**: Daily planning helps users decide what to focus on each day. While the web has a full plan page with AI Smart Pick, the CLI version provides the core planning workflow.

**Independent Test**: Run `clarity plan`. The system shows available tasks. Select tasks by number. The plan is confirmed and a summary of selected tasks is displayed.

**Acceptance Scenarios**:

1. **Given** the user has active goals with pending tasks, **When** they run `clarity plan`, **Then** an interactive planning session starts showing available tasks grouped by goal.
2. **Given** yesterday's plan had unfinished tasks, **When** the user starts `clarity plan`, **Then** those unfinished tasks are highlighted at the top with a prompt to carry them forward.
3. **Given** the planning session is active, **When** the user selects task numbers to include in today's plan, **Then** the selected tasks are added to the daily plan.
4. **Given** tasks have been selected, **When** the user confirms the plan, **Then** a summary is shown with the total number of tasks and estimated time.
5. **Given** the user doesn't want to plan today, **When** they run `clarity plan --skip`, **Then** the daily plan is skipped and a message confirms the skip.

---

### Edge Cases

- What happens when the user runs `clarity inbox` with no items? An empty state message is shown: "Inbox is empty. Add items with: clarity inbox add \"your item\""
- What happens when scheduling a task that's already scheduled? The existing schedule is overwritten with the new date/time.
- What happens when the user runs `clarity calendar` with no scheduled tasks? Each day shows "(no tasks)" and the overall message says "No tasks scheduled this week."
- What happens when `clarity plan` is run and a plan already exists for today? The existing plan is shown with current selections, allowing the user to modify it.
- What happens when an invalid task ID is passed to `clarity schedule`? An error message is shown: "Task not found: <id>"
- What happens when `clarity schedule` is called without a `--date` flag? An error is shown: "Required: --date YYYY-MM-DD"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST support `clarity inbox` to list unprocessed inbox items.
- **FR-002**: The CLI MUST support `clarity inbox add "<text>"` to create a new inbox item.
- **FR-003**: The CLI MUST support `clarity inbox convert <id> --to goal` to convert an inbox item into a goal.
- **FR-004**: The CLI MUST support `clarity inbox assign <id> --goal <goalId>` to convert an inbox item into a task under a goal.
- **FR-005**: The CLI MUST support `clarity inbox delete <id>` to soft-delete an inbox item.
- **FR-006**: The CLI MUST support `clarity schedule <taskId> --date YYYY-MM-DD` to schedule a task to a date.
- **FR-007**: The CLI MUST support optional `--time HH:MM` and `--duration <minutes>` flags on the schedule command.
- **FR-008**: The CLI MUST support `clarity unschedule <taskId>` to clear a task's schedule.
- **FR-009**: The CLI MUST support `clarity calendar` to display the current week's scheduled tasks day-by-day.
- **FR-010**: The CLI MUST support `clarity calendar --date YYYY-MM-DD` to view a specific week.
- **FR-011**: The CLI MUST support `clarity plan` to start an interactive daily planning session.
- **FR-012**: The CLI MUST support `clarity plan --skip` to skip daily planning.
- **FR-013**: All new commands MUST use the same data and business logic as the web dashboard (shared backend).
- **FR-014**: All new commands MUST display human-readable, formatted output consistent with existing CLI commands.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add an inbox item and convert it to a goal entirely from the CLI in under 30 seconds.
- **SC-002**: Users can schedule a task to a date from the CLI in a single command.
- **SC-003**: Users can view their week's scheduled tasks from the CLI and see the same tasks that appear on the web kanban board.
- **SC-004**: Users can complete a daily planning session from the CLI in under 2 minutes.
- **SC-005**: All 3 new command groups (inbox, schedule, plan) pass the existing build pipeline.

## Assumptions

- All new CLI commands reuse the existing tRPC procedures from the core package (`inbox.*`, `task.schedule`, `task.unschedule`, `task.getScheduled`, `dailyPlan.*`). No new backend logic is needed.
- The CLI uses the direct tRPC caller pattern (same as existing commands), not HTTP requests.
- The daily planning CLI flow is a simplified interactive version — it does not include AI Smart Pick (that remains web-only).
- Default duration when not specified via `--duration` is 30 minutes. Default time when not specified via `--time` is omitted (day-level scheduling only, using `task.update` instead of `task.schedule`).
- The `clarity calendar` output is a text-based day-by-day listing, not a visual board. Each day shows: date header, then indented tasks with title, time, duration, and goal.
