# Feature Specification: Fix Plan Page

**Feature Branch**: `008-fix-plan-page`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Plan page has circular update bug — clicking on task items triggers an infinite loop of dailyPlan.updateSelections API calls. Also need to clarify what the plan page does and make it usable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix Circular Update Loop (Priority: P1)

When the user opens the Plan page and clicks on a task checkbox to select it for today, a single `updateSelections` API call should fire — not an infinite loop. Currently, clicking any task triggers hundreds of batched `dailyPlan.updateSelections` calls per second, making the page unresponsive and flooding the server with requests. The root cause is the selection update logic triggering itself in a feedback loop.

**Why this priority**: This is a critical bug that makes the Plan page completely unusable. The infinite loop freezes the browser and floods the server.

**Independent Test**: Open the Plan page. Click "Start Planning" if needed. Click a task checkbox. The selection toggles, one update call fires, and the page remains responsive. Check server logs — only one `updateSelections` request appears.

**Acceptance Scenarios**:

1. **Given** the Plan page is loaded with tasks visible, **When** the user clicks a task checkbox, **Then** exactly one `updateSelections` API call fires (not hundreds).
2. **Given** a task is selected, **When** the user unchecks it, **Then** exactly one `updateSelections` API call fires and the total estimated minutes updates.
3. **Given** multiple tasks are toggled in sequence, **When** the user selects/deselects 5 tasks, **Then** no more than 5 API calls total are made.
4. **Given** the page loads with existing selections from a prior session, **When** the page finishes loading, **Then** no unnecessary update calls fire on initial render.

---

### User Story 2 - Clear Plan Page Purpose and Usability (Priority: P2)

The Plan page should clearly communicate its purpose: it helps the user decide which tasks to focus on today. The page should display a brief explanation of what daily planning is, show tasks grouped by goal for easy scanning, and allow the user to confirm their daily plan to proceed with focused work.

**Why this priority**: Even after fixing the bug, the page needs context so users understand why they're selecting tasks and what happens after confirming.

**Independent Test**: Navigate to the Plan page. Read the introductory text — it should explain the purpose. See tasks grouped by their parent goal. Select tasks, see the time summary, confirm the plan. The user is redirected to the home page.

**Acceptance Scenarios**:

1. **Given** the Plan page loads, **When** the user reads the page, **Then** there is a clear explanation of the page's purpose (daily task selection for focused work).
2. **Given** tasks are displayed, **When** the user scans the list, **Then** tasks are grouped under their goal headings for easy scanning.
3. **Given** tasks are selected, **When** the user views the summary, **Then** the total estimated time and number of selected tasks are clearly visible.
4. **Given** the plan is confirmed, **When** the user clicks "Confirm Plan", **Then** they are redirected to the home page.

---

### Edge Cases

- What happens when the user has no active goals or tasks? The page should display an empty state with a message like "No tasks available. Create goals and tasks first."
- What happens when the user revisits the Plan page after confirming? They should see the confirmed plan (read-only) or be redirected to home.
- What happens when the focus threshold is exceeded? The overcommit warning should display clearly without triggering additional API calls.
- What happens on page refresh during planning? Existing selections should be preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toggling a task checkbox MUST trigger at most one `updateSelections` API call — no feedback loops.
- **FR-002**: The Plan page MUST NOT fire any `updateSelections` calls on initial page load when loading existing selections.
- **FR-003**: The page MUST clearly explain its purpose (daily task planning for focused work).
- **FR-004**: Tasks MUST be displayed grouped by their parent goal.
- **FR-005**: The time summary (total selected minutes vs. focus threshold) MUST update after each selection change.
- **FR-006**: Existing selections MUST be preserved across page refreshes (loaded from the daily plan record).
- **FR-007**: The overcommit warning MUST display without causing additional API calls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking a task checkbox produces exactly 1 API call (measured by server logs) — zero infinite loops.
- **SC-002**: Page remains responsive during task selection — no visible lag or freezing.
- **SC-003**: Users can complete daily planning (select tasks + confirm) in under 30 seconds.
- **SC-004**: Tasks are visually grouped by goal — users can identify which goal each task belongs to.

## Assumptions

- The daily plan data model (`dailyPlans` table) is correct and doesn't need changes.
- The circular bug is caused by the `useEffect` dependency on the mutation object, not a server-side issue.
- The `OvercommitWarning` component works correctly and only needs the right data passed to it.
