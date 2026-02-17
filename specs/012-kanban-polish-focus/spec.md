# Feature Specification: Kanban Polish & Focus Mode

**Feature Branch**: `012-kanban-polish-focus`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "In calendar kanban, make it use the full width of browser so it displays more stuff. Also expand all the columns. In the task cards, don't use the whole left column for the complete check button, put that at the last line of the card, also put a start button next to it. Once I click the start button, it goes into focus mode and hides everything else. Also the text and color is very hard to read, redesign and make them more easily on eyes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full-Width Kanban Board Layout (Priority: P1)

The kanban calendar board expands to use the full browser width instead of being constrained by the app's content container. All seven day columns are visible and expanded equally across the screen so that task cards have room to display their full content without truncation. The backlog sidebar remains on the left but the board stretches edge-to-edge.

**Why this priority**: The current layout constrains the board width, making columns too narrow to read task details comfortably. This is the most fundamental usability improvement.

**Independent Test**: Navigate to the Calendar page. The kanban board spans the full browser width. All 7 day columns are visible and evenly distributed with adequate space for task card content.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Calendar page, **When** the page loads, **Then** the kanban board stretches to the full browser width (minus the backlog sidebar).
2. **Given** the board is displayed, **When** the user views all 7 columns, **Then** each column takes equal width and task card titles are fully visible without truncation.
3. **Given** the user resizes the browser window, **When** the window width changes, **Then** the columns resize proportionally to fill the available space.

---

### User Story 2 - Redesigned Task Card Layout & Readability (Priority: P2)

Task cards are redesigned for better readability and visual comfort. The completion checkbox is moved from the left side of the card to the bottom row. Text contrast is improved — task titles use a higher-contrast color, goal tags use softer background pills instead of raw colored text, and duration badges are more legible. The overall card uses softer border colors and subtle background tinting to reduce visual noise.

**Why this priority**: The current card design has hard-to-read text and colors. Improving readability is essential before adding new interactive elements.

**Independent Test**: View task cards on the kanban board. The card layout shows: task title (top, high contrast), goal tag as a colored pill, duration badge, then a bottom row with the completion checkbox and start button. All text is easy to read against the background.

**Acceptance Scenarios**:

1. **Given** a task card on the board, **When** the user views it, **Then** the title is displayed at the top of the card in a high-contrast readable font.
2. **Given** a task card, **When** the user views the bottom row, **Then** the completion checkbox appears on the left and the start button appears on the right.
3. **Given** a task card with a goal tag, **When** the user views it, **Then** the goal name is displayed as a colored pill with sufficient contrast (not raw colored text on dark background).
4. **Given** a task card with a duration, **When** the user views the duration badge, **Then** it is legible with clear contrast.
5. **Given** a completed task card, **When** the user views it, **Then** the card is visually de-emphasized (lower opacity or muted colors) with a green checkmark on the completion indicator.

---

### User Story 3 - Focus Mode with Timer (Priority: P3)

When the user clicks the "Start" button on a task card, the application enters focus mode. In focus mode, the entire screen is replaced with a centered, distraction-free view showing only: the task title (large text), an actual elapsed timer counting up, the planned duration, a STOP button to exit focus mode, and a completion checkbox. The sidebar, kanban board, and all other UI elements are hidden. Clicking STOP or the completion checkbox returns the user to the kanban board. The timer tracks actual time spent on the task.

**Why this priority**: Focus mode is a new feature that builds on the card redesign (Start button). It enhances the workflow but requires the other stories to be in place first.

**Independent Test**: Click the Start button on any task card. The screen transitions to focus mode showing the task title, running timer, planned duration, and STOP button. Click STOP to return to the kanban board.

**Acceptance Scenarios**:

1. **Given** a task card with a Start button, **When** the user clicks Start, **Then** the screen transitions to focus mode hiding all other UI elements.
2. **Given** focus mode is active, **When** the user views the screen, **Then** the task title is displayed large and centered, an actual timer counts up in real time, the planned duration is shown, and a STOP button is visible.
3. **Given** focus mode is active, **When** the user clicks STOP, **Then** focus mode exits and the user returns to the kanban board view.
4. **Given** focus mode is active, **When** the user clicks the completion checkbox, **Then** the task is marked complete and focus mode exits, returning to the kanban board.
5. **Given** focus mode was active for 5 minutes, **When** the user exits focus mode, **Then** the elapsed time is no longer visible (timer does not persist between sessions).

---

### Edge Cases

- What happens when the user starts focus mode and navigates away (e.g., clicks browser back)? Focus mode exits and the user returns to the kanban board.
- What happens when a completed task's Start button is clicked? Completed tasks do not show a Start button — only pending/in-progress tasks show it.
- What happens when the browser window is very narrow (mobile)? The kanban columns become horizontally scrollable; focus mode remains centered and fully usable at any width.
- What happens if the user refreshes the page while in focus mode? Focus mode is not persisted — the page reloads to the normal kanban board view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Calendar page MUST use the full browser width for the kanban board layout.
- **FR-002**: All 7 day columns MUST be equally expanded to fill the available board width.
- **FR-003**: Task card titles MUST use high-contrast colors that are easy to read against the card background.
- **FR-004**: Goal tags MUST be displayed as colored pills with readable text (not raw colored text).
- **FR-005**: The completion checkbox MUST be positioned in the bottom row of the task card, not as a left-column element.
- **FR-006**: A "Start" button MUST appear in the bottom row of each non-completed task card, next to the completion checkbox.
- **FR-007**: Clicking the Start button MUST activate focus mode, hiding all other page content.
- **FR-008**: Focus mode MUST display: task title (large centered text), actual elapsed timer (counting up), planned duration, STOP button, and completion checkbox.
- **FR-009**: Clicking STOP in focus mode MUST return the user to the kanban board.
- **FR-010**: Clicking the completion checkbox in focus mode MUST mark the task complete and exit focus mode.
- **FR-011**: Duration badges on task cards MUST be legible with clear contrast.
- **FR-012**: Card borders and colors MUST use softer, eye-friendly tones instead of harsh high-saturation colors.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 7 kanban columns are visible without horizontal scrolling on screens 1280px and wider.
- **SC-002**: Task card titles are fully readable without truncation for titles up to 40 characters.
- **SC-003**: Users can enter focus mode from any task card in 1 click (the Start button).
- **SC-004**: The focus mode timer updates every second with actual elapsed time.
- **SC-005**: Users can exit focus mode and return to the board in 1 click (STOP or complete).
- **SC-006**: All text on task cards meets a minimum contrast ratio of 4.5:1 against its background (WCAG AA).

## Assumptions

- This feature modifies the existing kanban calendar from feature 011. It is an enhancement, not a replacement.
- Focus mode is a client-side-only feature — the elapsed timer is not saved to the database. It resets if the page is refreshed.
- The "Start" button does not change the task's status to "in_progress" — it only activates the focus mode UI. The user marks completion via the checkbox.
- The full-width layout applies only to the Calendar page. Other pages retain their standard content width.
- "Softer colors" means reducing saturation and increasing lightness of goal color borders/tags for dark-mode readability, not changing the goal color palette itself.
