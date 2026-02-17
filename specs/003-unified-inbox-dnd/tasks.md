# Tasks: Unified Inbox & Dashboard DnD

**Input**: Design documents from `/specs/003-unified-inbox-dnd/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story. US6 (Card Interaction Model) is foundational since it provides selection, context menu, and modal patterns used by all other stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Paths are relative to repository root

---

## Phase 1: Setup (Schema & Types)

**Purpose**: Database schema changes and shared type updates needed by all user stories

- [X] T001 Add `deletedAt` column to goals table and `sortOrder` + `deletedAt` columns to inbox_items table in packages/db/src/schema.ts
- [X] T002 [P] Update Goal type to include optional `deletedAt` field in packages/types/src/goal.ts
- [X] T003 [P] Update InboxItem type to include `sortOrder` and optional `deletedAt` fields in packages/types/src/inbox.ts
- [X] T004 Apply schema changes by running `pnpm db:push` from repository root

---

## Phase 2: Foundational — US6 Card Interaction Model (Priority: P1)

**Purpose**: Shared UI components that ALL card-based user stories depend on (selection, context menu, modal)

**⚠️ CRITICAL**: No card-level user story work (US1–US5) can begin until this phase is complete

**Goal**: Build reusable context menu, modal, and card selection primitives

**Independent Test**: Single-click a goal card → highlight appears. Right-click → context menu. Double-click → modal opens. Escape/click-outside closes modal.

- [X] T005 [P] [US6] Create reusable `<ContextMenu>` component (React portal, absolute positioning, close on click-outside/Escape, accepts menu items array) in packages/web/src/components/context-menu.tsx
- [X] T006 [P] [US6] Create reusable `<Modal>` component (fixed overlay with backdrop, centered content, close on Escape/click-outside per FR-018, focus trap) in packages/web/src/components/modal.tsx
- [X] T007 [US6] Create `useCardSelection` hook managing `selectedCardId` state, click-outside deselection, and keyboard Delete handler in packages/web/src/hooks/use-card-selection.ts

**Checkpoint**: Foundational UI primitives ready — card-level stories can now begin

---

## Phase 3: US1 — Unified Brain Dump / Inbox Capture (Priority: P1) 🎯 MVP

**Goal**: Merge Brain Dump and Inbox into a single unified Inbox page with quick capture, "Process" (brain dump flow), and "Assign to Goal" actions

**Independent Test**: Navigate to /inbox → type a thought → press Enter → item appears. Right-click item → "Process" navigates to brain dump clarification flow. "Assign to Goal" creates a task under selected goal.

### Router Changes

- [X] T008 [US1] Add `inbox.process` procedure (creates brain dump from inbox item text, returns brainDumpId) in packages/core/src/router/inbox.ts
- [X] T009 [US1] Modify `inbox.list` to filter `WHERE deletedAt IS NULL` and order by `sortOrder ASC, createdAt DESC` in packages/core/src/router/inbox.ts
- [X] T010 [US1] Modify `inbox.count` to filter `WHERE deletedAt IS NULL` in packages/core/src/router/inbox.ts

### UI Changes

- [X] T011 [US1] Rewrite inbox-item.tsx: add selection state (single-click highlight via `isSelected`/`onSelect` props), right-click context menu (Process, Assign to Goal, Delete), double-click to open detail modal in packages/web/src/components/inbox-item.tsx
- [X] T012 [US1] Create inbox-detail-modal.tsx showing full item text with edit capability, using `<Modal>` component in packages/web/src/components/inbox-detail-modal.tsx
- [X] T013 [US1] Update inbox/page.tsx: integrate `useCardSelection` hook, pass selection props to items, handle "Process" navigation to `/dump/{brainDumpId}` in packages/web/src/app/inbox/page.tsx
- [X] T014 [US1] Update layout.tsx: remove "Brain Dump" nav link, keep "Inbox" link with badge count in packages/web/src/app/layout.tsx
- [X] T015 [P] [US1] Update dashboard page.tsx: replace "New Brain Dump" link with "Inbox" link in packages/web/src/app/page.tsx
- [X] T016 [P] [US1] Redirect /dump to /inbox in packages/web/src/app/dump/page.tsx (keep /dump/[id] for clarification flow)

**Checkpoint**: Unified inbox functional — brain dump and inbox merged into single page

---

## Phase 4: US2 — Goal Card DnD Reorder on Dashboard (Priority: P1)

**Goal**: Goal cards on the dashboard support drag-and-drop reordering with persistent sort order

**Independent Test**: Have 3+ goals → drag third goal above first → order changes → refresh page → order persists. Single goal → no drag handle shown.

### Router Changes

- [X] T017 [US2] Add `goal.reorder` procedure (accepts goalIds array, sets sortOrder=index) in packages/core/src/router/goal.ts
- [X] T018 [US2] Add `deletedAt IS NULL` filter to `goal.list` and `goal.get` queries in packages/core/src/router/goal.ts

### UI Changes

- [X] T019 [US2] Rewrite goal-card.tsx: remove `<Link>` wrapper, add drag handle (hidden when single goal), selection state (`isSelected`/`onSelect` props), right-click context menu (Delete, Archive, Open), double-click to open detail modal in packages/web/src/components/goal-card.tsx
- [X] T020 [US2] Create goal-detail-modal.tsx containing full goal detail view (title, purpose, progress bar, task list with SortableTaskList, breakdown button, archive button, focus mode link) using `<Modal>` component — replaces goal/[id]/page.tsx content in packages/web/src/components/goal-detail-modal.tsx
- [X] T021 [US2] Create sortable-goal-list.tsx DnD container using @atlaskit/pragmatic-drag-and-drop (mirror sortable-task-list.tsx pattern: monitorForElements + reorder + extractClosestEdge) in packages/web/src/components/sortable-goal-list.tsx
- [X] T022 [US2] Update dashboard page.tsx: replace static goal list with `<SortableGoalList>`, integrate `useCardSelection` hook, pass selection props in packages/web/src/app/page.tsx

**Checkpoint**: Goal cards draggable and reorderable on dashboard, detail modal works

---

## Phase 5: US3 — Goal Card Deletion from Dashboard (Priority: P1)

**Goal**: Delete goals via X button or Delete key with 5-second undo toast, cascade-delete all tasks

**Independent Test**: Click X on goal card → goal disappears + toast with "Undo" → click Undo within 5s → goal restored. Wait 5s → goal permanently deleted. Select goal + press Delete key → same behavior.

### Router Changes

- [X] T023 [US3] Add `goal.softDelete` procedure (sets deletedAt on goal + cascade soft-deletes all tasks, returns cascadeDeletedTaskIds) in packages/core/src/router/goal.ts
- [X] T024 [US3] Add `goal.undoDelete` procedure (restores goal + cascade-deleted tasks by setting deletedAt=NULL) in packages/core/src/router/goal.ts
- [X] T025 [US3] Add `goal.permanentDelete` procedure (hard-deletes goal row + all task rows, removes scheduled calendar entries) in packages/core/src/router/goal.ts

### UI Changes

- [X] T026 [US3] Add X button (top-right corner) to goal-card.tsx that triggers softDelete + shows Sonner toast with Undo action; on undo calls undoDelete, on timeout calls permanentDelete in packages/web/src/components/goal-card.tsx
- [X] T027 [US3] Wire Delete key handler in dashboard page.tsx: when a goal card is selected and Delete is pressed, trigger the same softDelete + toast flow in packages/web/src/app/page.tsx

**Checkpoint**: Goal deletion with undo fully functional from both X button and keyboard

---

## Phase 6: US4 — Inbox Item DnD Reorder (Priority: P2)

**Goal**: Inbox items support drag-and-drop reordering with persistent custom order

**Independent Test**: Have 3+ inbox items → drag one above another → reorder → navigate away and return → order persists.

### Router Changes

- [X] T028 [US4] Add `inbox.reorder` procedure (accepts itemIds array, sets sortOrder=index) in packages/core/src/router/inbox.ts

### UI Changes

- [X] T029 [US4] Add drag handle to inbox-item.tsx (hidden when single item) in packages/web/src/components/inbox-item.tsx
- [X] T030 [US4] Create sortable-inbox-list.tsx DnD container using @atlaskit/pragmatic-drag-and-drop (mirror sortable-goal-list.tsx pattern) in packages/web/src/components/sortable-inbox-list.tsx
- [X] T031 [US4] Update inbox/page.tsx to use `<SortableInboxList>` instead of plain list in packages/web/src/app/inbox/page.tsx

**Checkpoint**: Inbox items draggable and reorderable with persistent order

---

## Phase 7: US5 — Inbox Item Deletion with Undo (Priority: P2)

**Goal**: Delete inbox items via X button or Delete key with 5-second undo toast

**Independent Test**: Click X on inbox item → item disappears + toast with "Undo" → click Undo within 5s → item restored.

### Router Changes

- [X] T032 [US5] Add `inbox.softDelete` procedure (sets deletedAt=now) in packages/core/src/router/inbox.ts
- [X] T033 [US5] Add `inbox.undoDelete` procedure (sets deletedAt=NULL) in packages/core/src/router/inbox.ts

### UI Changes

- [X] T034 [US5] Update inbox-item.tsx X button to use softDelete + Sonner toast with Undo (on undo calls undoDelete) in packages/web/src/components/inbox-item.tsx
- [X] T035 [US5] Wire Delete key handler in inbox/page.tsx: when an inbox item is selected and Delete is pressed, trigger softDelete + toast flow in packages/web/src/app/inbox/page.tsx

**Checkpoint**: Inbox item deletion with undo fully functional from both X button and keyboard

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, cleanup, and edge case handling

- [X] T036 Verify full build passes with `pnpm -r run build` and fix any type errors
- [X] T037 Verify lint passes with `pnpm -r run lint` and fix any issues
- [X] T038 Update or redirect goal/[id]/page.tsx since detail modal replaces it — redirect to dashboard in packages/web/src/app/goal/[id]/page.tsx
- [ ] T039 Run quickstart.md scenarios 1–11 and verify all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational/US6 (Phase 2)**: Depends on Phase 1 (schema + types must exist)
- **US1 (Phase 3)**: Depends on Phase 2 (needs context menu, modal, selection hook)
- **US2 (Phase 4)**: Depends on Phase 2 (needs context menu, modal, selection hook)
- **US3 (Phase 5)**: Depends on Phase 4 (needs goal-card.tsx rewrite from US2)
- **US4 (Phase 6)**: Depends on Phase 3 (needs inbox-item.tsx rewrite from US1)
- **US5 (Phase 7)**: Depends on Phase 6 (needs drag handle from US4 in inbox-item.tsx)
- **Polish (Phase 8)**: Depends on all previous phases

### User Story Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (US6 Foundational)
        ├─► Phase 3 (US1 Unified Inbox)
        │     └─► Phase 6 (US4 Inbox DnD)
        │           └─► Phase 7 (US5 Inbox Delete)
        └─► Phase 4 (US2 Goal DnD)
              └─► Phase 5 (US3 Goal Delete)
                        └─► Phase 8 (Polish)
```

### File Dependency Map (same-file conflicts)

| File | Phases that modify it | Must be sequential |
|------|-----------------------|-------------------|
| packages/core/src/router/goal.ts | US2 (T017–T018), US3 (T023–T025) | US2 → US3 |
| packages/core/src/router/inbox.ts | US1 (T008–T010), US4 (T028), US5 (T032–T033) | US1 → US4 → US5 |
| packages/web/src/components/goal-card.tsx | US2 (T019), US3 (T026) | US2 → US3 |
| packages/web/src/components/inbox-item.tsx | US1 (T011), US4 (T029), US5 (T034) | US1 → US4 → US5 |
| packages/web/src/app/page.tsx | US1 (T015), US2 (T022), US3 (T027) | US1 → US2 → US3 |
| packages/web/src/app/inbox/page.tsx | US1 (T013), US4 (T031), US5 (T035) | US1 → US4 → US5 |

### Parallel Opportunities

**Within Phase 1**:
```
T001 (schema) → T002 [P] (goal types) + T003 [P] (inbox types) → T004 (db:push)
```

**Within Phase 2 (US6)**:
```
T005 [P] (context-menu.tsx) + T006 [P] (modal.tsx) → T007 (useCardSelection hook)
```

**Phase 3 (US1) and Phase 4 (US2) can run in parallel** since they modify different files (inbox vs goal), EXCEPT T015 and T022 both touch page.tsx — T015 should run first.

**Within Phase 3 (US1)**:
```
T008–T010 (router) → T011 (inbox-item) + T012 [P] (inbox-detail-modal) → T013 (inbox page)
T014 [P] (layout) + T015 [P] (dashboard) + T016 [P] (dump redirect) can run in parallel
```

---

## Implementation Strategy

### MVP First (US6 + US1 Only)

1. Complete Phase 1: Setup (schema + types)
2. Complete Phase 2: US6 Foundational (context menu, modal, selection)
3. Complete Phase 3: US1 Unified Inbox
4. **STOP and VALIDATE**: Test unified inbox independently
5. The app now has a single unified inbox replacing both Brain Dump and Inbox pages

### Incremental Delivery

1. Setup + US6 → Foundation ready
2. Add US1 (Unified Inbox) → Test → **MVP delivered**
3. Add US2 (Goal DnD) → Test → Dashboard reordering works
4. Add US3 (Goal Delete) → Test → Full dashboard management
5. Add US4 (Inbox DnD) → Test → Inbox reordering works
6. Add US5 (Inbox Delete) → Test → Full inbox management
7. Polish → Build/lint verification, redirects, quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US6 is treated as foundational (Phase 2) since all other stories depend on its components
- US3 depends on US2 (same file: goal-card.tsx); US5 depends on US4 (same file: inbox-item.tsx)
- The brain dump clarification flow (/dump/[id]) is unchanged — only the entry point moves to inbox
- Existing `inbox.delete` (hard delete) is kept but UI switches to softDelete for undo support
