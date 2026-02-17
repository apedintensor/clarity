# Feature Specification: Unified Inbox & Dashboard DnD

**Feature Branch**: `003-unified-inbox-dnd`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "brain dump=inbox, dont separate them, i mean use the todolist inbox style for the brain dump. also i still cannot drag and drop to arrange the goal card, or delete them in dashboard. same for brain dump."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Brain Dump / Inbox Capture (Priority: P1)

Currently brain dumps and inbox items are separate concepts with separate pages. The user wants a single Todoist-style inbox that serves as both the quick-capture inbox and the brain dump entry point. When a user opens the app, they can type a thought into one unified input -- it goes into the inbox. From the inbox, they can either process items into goals (what brain dumps do today) or assign them directly to existing goals as tasks (what inbox does today). The separate "Brain Dump" page and "Inbox" page become one unified "Inbox" page.

**Why this priority**: This is the core conceptual change -- merging two overlapping features into one cohesive experience. Everything else depends on this unified model.

**Independent Test**: Can be tested by navigating to the Inbox page, typing a thought, and then choosing to either "Process into goals" (brain dump flow) or "Assign to goal" (inbox flow) from the same item.

**Acceptance Scenarios**:

1. **Given** the user is on any page, **When** they click "Inbox" in the nav, **Then** they see a single unified inbox with a quick-capture input at the top.
2. **Given** the user has typed a thought into the inbox capture, **When** they press Enter, **Then** the item appears in the inbox list immediately.
3. **Given** an unprocessed inbox item exists, **When** the user clicks "Process" on it, **Then** they are taken to the brain dump clarification/goal-extraction flow for that item.
4. **Given** an unprocessed inbox item exists, **When** the user clicks "Assign to Goal", **Then** they see a goal picker and the item becomes a task under the selected goal.
5. **Given** items exist in the inbox, **When** the user views the inbox, **Then** items are shown in reverse-chronological order (newest first) with a count badge in the nav.

---

### User Story 2 - Goal Card Drag-and-Drop Reorder on Dashboard (Priority: P1)

On the dashboard, goal cards are currently rendered in a static list. The user wants to drag and drop goal cards to rearrange their display order. The new order should persist so the user always sees their most important goals at the top.

**Why this priority**: This is a direct usability gap -- users cannot organize their dashboard, which is their primary view.

**Independent Test**: Can be tested by dragging a goal card from one position to another on the dashboard and verifying the order persists after page reload.

**Acceptance Scenarios**:

1. **Given** the user has 2 or more active goals on the dashboard, **When** they grab a goal card's drag handle and move it above or below another card, **Then** the cards reorder visually in real-time.
2. **Given** the user has reordered goal cards, **When** they refresh the page, **Then** the new order is preserved.
3. **Given** only one goal exists, **When** the user views the dashboard, **Then** no drag handle is shown (nothing to reorder).

---

### User Story 3 - Goal Card Deletion from Dashboard (Priority: P1)

Users cannot currently delete goals from the dashboard. They can only archive them. The user wants a quick way to delete a goal entirely from the dashboard, with an undo option to prevent accidental data loss.

**Why this priority**: Equal to DnD -- both are basic list management operations users expect.

**Independent Test**: Can be tested by clicking the delete action on a goal card, verifying it disappears, and clicking "Undo" within the grace period to restore it.

**Acceptance Scenarios**:

1. **Given** the user has an active goal on the dashboard, **When** they click the X button at the top-right corner of the goal card, **Then** the goal is removed from view and a toast notification appears with an "Undo" option.
5. **Given** the user has focused/selected a goal card, **When** they press the Delete key on the keyboard, **Then** the goal is deleted with the same undo behavior as clicking the X button.
2. **Given** the user deleted a goal and the undo toast is visible, **When** they click "Undo" within 5 seconds, **Then** the goal is restored to its previous position.
3. **Given** the user deleted a goal, **When** 5 seconds pass without clicking Undo, **Then** the goal and all its associated tasks are permanently removed.
4. **Given** a goal has tasks associated with it, **When** the user deletes the goal, **Then** all tasks under that goal are also deleted.

---

### User Story 4 - Inbox Item Drag-and-Drop Reorder (Priority: P2)

Users should be able to drag and drop inbox items to reorder them by priority. This allows users to move important items to the top for processing first.

**Why this priority**: Follows the same DnD pattern as goals but on the inbox page. Lower priority since inbox items are typically processed in order of arrival.

**Independent Test**: Can be tested by dragging an inbox item above another and verifying the new order persists.

**Acceptance Scenarios**:

1. **Given** the user has multiple items in the inbox, **When** they drag one item above another, **Then** the items reorder and the new order persists.
2. **Given** the user reorders inbox items, **When** they navigate away and return, **Then** the custom order is preserved.

---

### User Story 5 - Inbox Item Deletion with Undo (Priority: P2)

Users should be able to quickly delete inbox items they no longer need, with the same undo pattern used elsewhere in the app.

**Why this priority**: Complements the reorder feature for full inbox management.

**Independent Test**: Can be tested by clicking delete on an inbox item and verifying the undo toast appears.

**Acceptance Scenarios**:

1. **Given** the user has an inbox item, **When** they click the X button at the top-right corner of the item, **Then** the item is removed and a toast with "Undo" appears for 5 seconds.
3. **Given** the user has focused/selected an inbox item, **When** they press the Delete key on the keyboard, **Then** the item is deleted with the same undo behavior as clicking the X button.
2. **Given** the user deleted an inbox item, **When** they click Undo within 5 seconds, **Then** the item is restored.

---

### User Story 6 - Card Interaction Model: Select, Context Menu, Detail Modal (Priority: P1)

All item cards (goal cards on dashboard, inbox items) follow a consistent interaction model: single-click to select/focus the card, right-click to open a context menu with actions, and double-click to open a detail view in a modal dialog (not a new page). This creates a desktop-app-like feel with fast, in-place interactions.

**Why this priority**: This defines the fundamental interaction pattern for all cards in the app. It affects every other user story since selection is required for keyboard Delete, context menus replace inline action buttons, and detail modals replace page navigation.

**Independent Test**: Can be tested by single-clicking a goal card (visual selection state), right-clicking it (context menu appears), and double-clicking it (detail modal opens).

**Acceptance Scenarios**:

1. **Given** the user sees a goal card on the dashboard, **When** they single-click it, **Then** the card shows a selected/focused visual state (highlight border or background change).
2. **Given** the user sees a goal card on the dashboard, **When** they right-click it, **Then** a context menu appears with actions (e.g., Delete, Archive, Open).
3. **Given** the user sees a goal card on the dashboard, **When** they double-click it, **Then** a detail modal opens showing full goal details, tasks, progress, and all goal management actions (task breakdown, focus mode, archive) — replacing the need for a separate goal detail page.
4. **Given** the user sees an inbox item, **When** they single-click it, **Then** the item shows a selected/focused visual state.
5. **Given** the user sees an inbox item, **When** they right-click it, **Then** a context menu appears with actions (e.g., Process, Assign to Goal, Delete).
6. **Given** the user sees an inbox item, **When** they double-click it, **Then** a detail modal opens showing the full item text with edit capability.
7. **Given** a detail modal is open, **When** the user clicks outside the modal or presses Escape, **Then** the modal closes.

---

### Edge Cases

- What happens when the user processes an inbox item into goals but then deletes it from inbox? The created goals remain intact.
- How does the system handle dragging when only one item exists? No drag handle is shown.
- What happens if the user tries to delete all goals? The dashboard shows the empty state with "No active goals" message.
- What happens to scheduled/calendar tasks when their parent goal is deleted? They are removed from the calendar.
- What happens to existing brain dump data? It remains accessible but new entries go through the unified inbox.
- What if the user captures a very long text (multi-paragraph brain dump) in the inbox? The input accepts multi-line text and passes it through to the brain dump processing flow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single unified inbox page that replaces both the current "Brain Dump" and "Inbox" pages.
- **FR-002**: The unified inbox MUST allow users to quickly capture thoughts via a text input at the top of the page.
- **FR-003**: Each inbox item MUST offer two processing paths: "Process into goals" (launches brain dump clarification flow) and "Assign to existing goal" (converts to task).
- **FR-004**: The navigation MUST show a single "Inbox" link with a badge showing the count of unprocessed items, replacing separate "Brain Dump" and "Inbox" links.
- **FR-005**: The "New Brain Dump" button on the dashboard MUST be replaced with a link to the unified inbox.
- **FR-006**: Goal cards on the dashboard MUST support drag-and-drop reordering via a visible drag handle.
- **FR-007**: Goal card reorder MUST persist the new sort order so it survives page reloads.
- **FR-008**: Goal cards MUST have an X button at the top-right corner for deletion, with a 5-second undo window via toast notification. Users MUST also be able to delete a focused goal card by pressing the Delete key on the keyboard.
- **FR-009**: Deleting a goal MUST cascade-delete all associated tasks, including removing them from calendar schedules.
- **FR-010**: Inbox items MUST support drag-and-drop reordering with persistent sort order.
- **FR-011**: Inbox items MUST have an X button at the top-right corner for deletion, with a 5-second undo window via toast notification. Users MUST also be able to delete a focused inbox item by pressing the Delete key on the keyboard.
- **FR-012**: The system MUST preserve all existing inbox item assignment functionality (assign to goal creates a task).
- **FR-013**: When an inbox item is processed via the brain dump flow, the system MUST pass the item's text as the raw brain dump content and mark the inbox item as processed.
- **FR-014**: Items with no custom order MUST display in reverse chronological order (newest first).
- **FR-015**: Single-clicking a goal card or inbox item MUST visually select/focus it (highlighted border or background change). Only one card may be selected at a time.
- **FR-016**: Right-clicking a goal card or inbox item MUST open a context menu with relevant actions (goal: Delete, Archive, Open; inbox: Process, Assign to Goal, Delete).
- **FR-017**: Double-clicking a goal card MUST open a detail modal showing full goal details, tasks, progress, and all goal management actions (task breakdown, focus mode, archive). This modal replaces the separate goal detail page. Double-clicking an inbox item MUST open a detail modal showing the full item text with edit capability. Detail views MUST NOT navigate to a new page.
- **FR-018**: Detail modals MUST close when the user clicks outside the modal or presses the Escape key.

### Key Entities

- **Inbox Item (modified)**: Unified capture entity replacing both brain dumps and inbox items. Adds a `sortOrder` field for custom ordering. Retains existing fields: title, description, status (unprocessed, assigned, processed, deleted), assigned goal/task references.
- **Goal (modified)**: Adds support for soft-delete with undo. Existing `sortOrder` field already supports reordering but needs a reorder endpoint.
- **Brain Dump (deprecated)**: The standalone brain dump entity is replaced by inbox items with a "process" action. Existing brain dump data remains accessible but new entries go through the inbox.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can capture a new thought and see it in the inbox in under 2 seconds.
- **SC-002**: Users can reorder goal cards on the dashboard via drag-and-drop and see the new order on page reload.
- **SC-003**: Users can delete a goal from the dashboard and undo the action within 5 seconds, with 100% data restoration on undo.
- **SC-004**: Users can reorder inbox items via drag-and-drop and see the new order on page reload.
- **SC-005**: The unified inbox replaces both brain dump and inbox pages -- users have one entry point for capturing and processing thoughts.
- **SC-006**: All existing brain dump processing flows (clarification, goal extraction) remain functional when triggered from an inbox item.

## Clarifications

### Session 2026-02-14

- Q: How should goal deletion be triggered on the dashboard? → A: X button at the top-right corner of the goal card, plus Delete key on keyboard when card is focused.
- Q: Should inbox items use the same X button + Delete key pattern? → A: Yes, consistent pattern across both goal cards and inbox items.
- Q: What is the card interaction model? → A: Single-click to select, right-click for context menu, double-click to open detail modal (not a new page). Applies to both goal cards and inbox items.
- Q: Should the goal detail modal replace the existing goal detail page? → A: Yes, modal replaces the page entirely — all goal interactions happen in the modal.

## Assumptions

- Single-user app (no multi-user permission concerns).
- Existing brain dump data (raw text entries) will remain in the database but the UI entry point moves to the inbox.
- The brain dump clarification flow (AI-powered) continues to work the same way -- it just receives its input from an inbox item rather than a dedicated brain dump page.
- The "Assign to Goal" action on inbox items uses the same flow already built in feature 002.
- Soft-delete pattern (with undo) for goals follows the same 5-second window pattern used for task deletion.
- Dashboard goal cards use the same drag-and-drop library already installed.
