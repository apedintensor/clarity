# Research: Unified Inbox & Dashboard DnD

**Feature**: 003-unified-inbox-dnd | **Date**: 2026-02-14

## R1: Drag-and-Drop for Goal Cards

**Decision**: Use @atlaskit/pragmatic-drag-and-drop (already installed)
**Rationale**: The project already uses this library for task reordering in `sortable-task-list.tsx`. Using the same library ensures consistency and avoids adding new dependencies.
**Alternatives considered**:
- `@dnd-kit/core`: Would require a new dependency and different API patterns
- HTML5 native drag-and-drop: Limited styling control, no edge detection
**Pattern**: Create `sortable-goal-list.tsx` mirroring the existing `sortable-task-list.tsx` pattern — `monitorForElements` + `reorder` + `extractClosestEdge`.

## R2: Soft-Delete with Undo Pattern for Goals

**Decision**: Reuse the existing task soft-delete pattern (deletedAt column + 5-second undo via Sonner toast)
**Rationale**: Tasks already implement this pattern with `softDelete` and `undoDelete` mutations plus `toast()` with an undo action. Goals should follow the same pattern for consistency.
**Implementation**: Add `deletedAt` column to goals table. `goal.softDelete` sets `deletedAt = now()`. `goal.undoDelete` sets `deletedAt = null`. `goal.list` filters `WHERE deletedAt IS NULL`. Cascade: when a goal is soft-deleted, also soft-delete all its tasks. When undone, restore all tasks that were deleted in the same operation.
**Alternatives considered**:
- Hard delete with undo via temporary storage: More complex, no benefit
- Archive instead of delete: Already exists as separate action

## R3: Context Menu Component

**Decision**: Build a lightweight custom context menu using React portal + absolute positioning
**Rationale**: No existing context menu library is installed. A custom component is simpler than adding a dependency for a single use case. The menu needs to show on right-click, position near the cursor, and close on click-outside or Escape.
**Implementation**: A `<ContextMenu>` component that:
- Renders via React portal to avoid overflow clipping
- Positions based on mouse event coordinates
- Accepts an array of `{ label, onClick, variant? }` menu items
- Closes on click-outside, Escape, or item click
**Alternatives considered**:
- Radix UI context menu: Would add a new dependency tree
- Headless UI: Not installed, overkill for this use case

## R4: Detail Modal Pattern

**Decision**: Build a reusable modal dialog component, used for both goal detail and inbox item detail
**Rationale**: The spec requires double-click to open detail views as modals (not new pages). Goal detail modal replaces the existing `goal/[id]/page.tsx`. Need a modal with overlay, close on Escape/click-outside, and scrollable content area.
**Implementation**: A `<Modal>` component wrapping content with:
- Fixed overlay with backdrop blur
- Centered content container with max-width/max-height
- Close on Escape key or overlay click (FR-018)
- Focus trap for accessibility
The goal detail modal will contain all content currently in `goal/[id]/page.tsx` (title, purpose, progress, task list, breakdown button, archive button, focus mode link).
**Alternatives considered**:
- HTML `<dialog>` element: Good native option but inconsistent backdrop behavior across browsers
- Keep goal detail as a page: Spec explicitly requires modal

## R5: Unified Inbox — Merging Brain Dump and Inbox

**Decision**: The inbox page becomes the sole entry point. Inbox items gain a "Process" action that passes item text to the existing brain dump clarification flow.
**Rationale**: The spec merges the two concepts. The brain dump processing pipeline (AI analysis, clarification questions, goal extraction) is unchanged — only its entry point moves to the inbox.
**Implementation**:
1. Inbox "Process" action: creates a brain dump record from the inbox item's text, then navigates to `/dump/{brainDumpId}` for the clarification flow
2. Dashboard "New Brain Dump" button → becomes "Inbox" link
3. Nav: "Brain Dump" link removed, "Inbox" link remains (already exists)
4. The `/dump` page redirects to `/inbox`. The `/dump/[id]` page remains for the clarification flow.
**Data migration**: None required. Existing brain dumps stay in the database. New brain dumps are created from inbox items.

## R6: Inbox Item Sort Order

**Decision**: Add `sortOrder` integer column to inbox_items table, defaulting to 0
**Rationale**: Inbox items currently display in chronological order via `createdAt`. Adding `sortOrder` enables custom ordering via DnD while preserving chronological as the default (items with sortOrder=0 fall back to createdAt desc).
**Implementation**: `inbox.reorder` procedure accepts `{ itemIds: string[] }` and sets sortOrder = index. `inbox.list` orders by `sortOrder ASC, createdAt DESC`.

## R7: Card Selection State

**Decision**: Manage selection state at the page level (dashboard or inbox), not per-card
**Rationale**: Only one card can be selected at a time (FR-015). Page-level state ensures mutual exclusion naturally.
**Implementation**: `selectedCardId` state in the parent page. Pass `isSelected` and `onSelect` props to each card. Selection shown via highlighted border (`border-[var(--accent)]`). Clicking outside any card deselects. Delete key handler at page level checks `selectedCardId` and triggers soft-delete.
