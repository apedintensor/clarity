# Feature Specification: AI Daily Planner

**Feature Branch**: `009-ai-daily-planner`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Add an AI suggest button on plan page to help pick the highest value tasks, prioritize things, give AI enough context. Add a button for AI priority and auto-add to calendar."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Smart Pick for Daily Planning (Priority: P1)

On the Plan Your Day page, the user sees a "Smart Pick" button alongside the task list. When clicked, the AI analyzes all available tasks across all goals — considering goal purpose, task descriptions, estimated durations, deadlines, goal progress, and the user's focus threshold — and recommends a prioritized set of tasks for the day. The AI selects tasks that fit within the user's focus time budget and maximizes value by favoring:

- Tasks on goals with upcoming deadlines or low progress
- Quick wins that build momentum (shorter tasks first in the morning)
- Balanced distribution across goals (avoid neglecting any active goal)
- Tasks the user carried forward from yesterday (unfinished business)

The recommended tasks are pre-selected (checked) in the task list with a visual indicator showing they were AI-recommended. The user can then modify the selection before confirming.

**Why this priority**: This is the core value of the feature — AI-powered prioritization eliminates decision fatigue and ensures users work on the most impactful tasks.

**Independent Test**: Open the Plan page with 10+ tasks across 3 goals. Click "Smart Pick". The AI recommends 4-6 tasks that fit within the 6-hour focus threshold. The recommended tasks are pre-selected with visual indicators. The user can uncheck any and add others before confirming.

**Acceptance Scenarios**:

1. **Given** the user has 10+ active tasks across multiple goals, **When** they click "Smart Pick", **Then** the AI selects a set of tasks that fits within the focus threshold and a brief reasoning appears for each recommended task.
2. **Given** the AI has made recommendations, **When** the user views the task list, **Then** AI-recommended tasks are visually distinguished (e.g., highlighted border, "AI Pick" badge).
3. **Given** the AI has pre-selected tasks, **When** the user unchecks an AI recommendation and checks a different task, **Then** the selection updates normally and the time summary recalculates.
4. **Given** the user has yesterday's unfinished tasks, **When** they click "Smart Pick", **Then** those carry-forward tasks are prioritized in the AI selection.
5. **Given** the AI is processing, **When** the user waits, **Then** a loading indicator shows on the button ("Analyzing..." or similar).

---

### User Story 2 - Auto-Schedule to Calendar (Priority: P2)

After the user has selected their daily tasks (either manually or via AI Smart Pick), a "Schedule to Calendar" button appears. When clicked, the system automatically assigns time slots to each selected task on today's calendar, starting from the current time (or a configurable start time like 9:00 AM if it's before that). Tasks are scheduled sequentially with no gaps, respecting each task's estimated duration. Short tasks are placed earlier, longer deep-work tasks are placed mid-morning/afternoon.

**Why this priority**: Auto-scheduling removes the manual drag-and-drop effort and turns the daily plan into an actionable calendar in one click.

**Independent Test**: Select 4 tasks totaling 3 hours. Click "Schedule to Calendar". Navigate to the Calendar page — all 4 tasks appear as events starting from the next available time slot, placed sequentially.

**Acceptance Scenarios**:

1. **Given** the user has selected 4 tasks in the plan, **When** they click "Schedule to Calendar", **Then** all 4 tasks appear on today's calendar as scheduled events.
2. **Given** it's 10:30 AM and the user schedules tasks, **When** the schedule is created, **Then** the first task starts at the next half-hour (11:00 AM) and subsequent tasks follow.
3. **Given** tasks have different estimated durations, **When** auto-scheduled, **Then** each calendar event matches the task's estimated duration.
4. **Given** some tasks are already scheduled on today's calendar, **When** the user clicks "Schedule to Calendar", **Then** new tasks are scheduled around existing events (no overlaps).
5. **Given** the schedule is created, **When** the user navigates to the Calendar page, **Then** the newly scheduled tasks are visible with correct times and durations.

---

### User Story 3 - AI Priority Reasoning (Priority: P3)

When the AI makes its Smart Pick recommendations, each recommended task shows a brief one-line reason explaining why it was chosen (e.g., "Goal at 20% — needs attention", "Quick win to build momentum", "Carried from yesterday"). This transparency helps the user trust the AI's judgment and learn to prioritize better over time.

**Why this priority**: Reasoning makes the AI transparent rather than a black box. It builds trust and helps users develop their own prioritization skills.

**Independent Test**: Click "Smart Pick". Each AI-recommended task shows a one-line reasoning tag below the task title explaining why it was selected.

**Acceptance Scenarios**:

1. **Given** the AI has recommended tasks, **When** the user views a recommended task, **Then** a brief reasoning line appears (e.g., "Low goal progress — 15% complete").
2. **Given** a carried-forward task is recommended, **When** the user sees it, **Then** the reasoning says "Unfinished from yesterday".
3. **Given** a short task is recommended early, **When** the user sees it, **Then** the reasoning says something like "Quick win — 25 min".

---

### Edge Cases

- What happens when there are fewer tasks than the focus threshold allows? The AI selects all available tasks and notes that the user has capacity for more.
- What happens when the AI recommendation takes too long (>10 seconds)? A timeout message appears and the user can retry or pick manually.
- What happens when all tasks have the same priority signal? The AI falls back to shortest-first ordering within each goal.
- What happens when the user clicks "Schedule to Calendar" but today's calendar is already full? A warning appears: "Calendar has conflicts — some tasks may overlap. Review on calendar."
- What happens when there are no tasks at all? The "Smart Pick" and "Schedule to Calendar" buttons are disabled with a tooltip explaining why.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Plan page MUST have a "Smart Pick" button that triggers AI-powered task selection.
- **FR-002**: The AI MUST analyze all active tasks across all goals to make recommendations.
- **FR-003**: The AI MUST consider goal progress, task duration, carry-forward status, and focus threshold when recommending.
- **FR-004**: AI-recommended tasks MUST be visually distinguished from manually selected tasks.
- **FR-005**: The user MUST be able to modify AI selections (add/remove tasks) before confirming.
- **FR-006**: The Plan page MUST have a "Schedule to Calendar" button that auto-creates calendar events for selected tasks.
- **FR-007**: Auto-scheduled tasks MUST be placed sequentially starting from the next available time slot.
- **FR-008**: Auto-scheduling MUST NOT create overlapping events with existing calendar entries.
- **FR-009**: Each AI-recommended task MUST display a brief reasoning (one line) for why it was selected.
- **FR-010**: The "Smart Pick" button MUST show a loading state while the AI is processing.
- **FR-011**: Both buttons MUST be disabled when there are no active tasks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: AI Smart Pick returns recommendations within 5 seconds for up to 50 tasks.
- **SC-002**: AI-selected tasks fit within the user's focus threshold at least 95% of the time.
- **SC-003**: Auto-scheduling creates calendar events for all selected tasks within 2 seconds.
- **SC-004**: Users can complete the full flow (Smart Pick → review → Schedule to Calendar → confirm) in under 60 seconds.
- **SC-005**: Each AI recommendation includes a visible reasoning tag — 100% of recommended tasks show a reason.

## Assumptions

- The AI uses the same Gemini model already configured for the brainstorm chat.
- The focus threshold defaults to 6 hours (360 minutes) as set in the daily plan.
- Auto-scheduling uses 30-minute time slot granularity (tasks start on the hour or half-hour).
- The AI receives all goal titles, purposes, task titles, estimated durations, and goal progress percentages as context.
- If it's past 6 PM, auto-scheduling defaults to tomorrow morning (9:00 AM start).
