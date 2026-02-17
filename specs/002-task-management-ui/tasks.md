# Tasks: Task Management UI

**Input**: Design documents from `/specs/002-task-management-ui/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md

**Tests**: No test tasks included — tests were not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/web/`, `packages/core/`, `packages/db/`, `packages/types/`
- Types → DB schema → Core routers → Web components/pages

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and configure libraries

- [x] T001 Install Pragmatic Drag and Drop dependency in packages/web/ (`pnpm --filter @clarity/web add @atlaskit/pragmatic-drag-and-drop`)
- [x] T002 Install FullCalendar v7 dependencies in packages/web/ (`pnpm --filter @clarity/web add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction temporal-polyfill`)
- [x] T003 Install Sonner toast library in packages/web/ (`pnpm --filter @clarity/web add sonner`)
- [x] T004 Add Sonner `<Toaster />` provider to packages/web/src/app/layout.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema changes and shared types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add `deleted_at` column to tasks table in packages/db/src/schema.ts (text, nullable — soft-delete support for US2)
- [x] T006 Add scheduling columns to tasks table in packages/db/src/schema.ts (`scheduled_date` text nullable, `scheduled_start` text nullable, `scheduled_duration` integer nullable default 30)
- [x] T007 Add `inbox_items` table to packages/db/src/schema.ts per data-model.md (id, user_id, title, description, status, assigned_goal_id, assigned_task_id, created_at, updated_at with indexes)
- [x] T008 Add `daily_plans` table to packages/db/src/schema.ts per data-model.md (id, user_id, date, selected_task_ids JSON, total_estimated_minutes, focus_threshold_minutes, is_overcommitted, status, created_at, updated_at with unique index on user_id+date)
- [x] T009 Run `pnpm db:push` to apply schema changes to SQLite
- [x] T010 [P] Add schedule fields (scheduledDate, scheduledStart, scheduledDuration, deletedAt) to Task type in packages/types/src/task.ts
- [x] T011 [P] Create InboxItem type definitions in packages/types/src/inbox.ts per data-model.md
- [x] T012 [P] Create DailyPlan type definitions in packages/types/src/daily-plan.ts per data-model.md
- [x] T013 Re-export new types from packages/types/src/index.ts (add inbox and daily-plan exports)

**Checkpoint**: Schema and types ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Drag-and-Drop Task Reordering (Priority: P1) 🎯 MVP

**Goal**: Users can drag tasks and subtasks to reorder them within a goal; new order persists immediately.

**Independent Test**: Create a goal with 3+ tasks, drag task 3 to position 1, refresh page, verify new order persists.

### Implementation for User Story 1

- [ ] T014 [US1] Add `task.reorder` tRPC procedure to packages/core/src/router/task.ts — accepts goalId + ordered taskIds array, updates sortOrder for each task per contracts/api.md
- [ ] T015 [US1] Create sortable-task-list.tsx component in packages/web/src/components/sortable-task-list.tsx — wraps task list with Pragmatic Drag and Drop, handles vertical reorder for tasks within a goal, supports nested subtask reordering
- [ ] T016 [US1] Add drag handle UI to existing task-item.tsx in packages/web/src/components/task-item.tsx — add grip icon, drag source registration with Pragmatic Drag and Drop, visual drag preview
- [ ] T017 [US1] Integrate sortable-task-list into goal detail page at packages/web/src/app/goal/[id]/page.tsx — replace static task list with DnD-enabled list, call task.reorder on drop
- [ ] T018 [US1] Add touch support for drag-and-drop in sortable-task-list.tsx — long-press to initiate drag on mobile viewports
- [ ] T019 [US1] Handle invalid drop zones in sortable-task-list.tsx — return task to original position when dropped outside valid area, no data mutation on cancel

**Checkpoint**: Drag-and-drop reordering fully functional — MVP deliverable

---

## Phase 4: User Story 2 — Quick Task Deletion (Priority: P1)

**Goal**: Users can delete any task with a single click, see a confirmation for parent tasks, and undo within 5 seconds.

**Independent Test**: Delete a task, verify it disappears, click Undo within 5 seconds, verify it reappears in original position.

### Implementation for User Story 2

- [ ] T020 [US2] Add `task.softDelete` tRPC procedure to packages/core/src/router/task.ts — sets deleted_at timestamp, cascades to subtasks, clears scheduling data, recalculates goal progress per contracts/api.md
- [ ] T021 [US2] Add `task.undoDelete` tRPC procedure to packages/core/src/router/task.ts — clears deleted_at if within 30 seconds, restores subtasks and sortOrder, recalculates goal progress
- [ ] T022 [US2] Add `task.permanentDelete` tRPC procedure to packages/core/src/router/task.ts — hard-deletes tasks where deleted_at is older than 30 seconds
- [ ] T023 [US2] Update goal progress queries in packages/core/src/router/goal.ts to exclude soft-deleted tasks (WHERE deleted_at IS NULL)
- [ ] T024 [US2] Create delete-confirm.tsx component in packages/web/src/components/delete-confirm.tsx — delete button on task row, confirmation dialog when task has subtasks (shows subtask count), triggers Sonner toast with "Undo" action button on successful delete
- [ ] T025 [US2] Add delete button to task-item.tsx in packages/web/src/components/task-item.tsx — trash icon, calls softDelete mutation, shows undo toast via Sonner with 5-second auto-dismiss
- [ ] T026 [US2] Wire undo flow in packages/web/src/app/goal/[id]/page.tsx — on toast "Undo" click, call task.undoDelete, invalidate task list query, restore UI state
- [ ] T027 [US2] Add delete support to focus view at packages/web/src/app/focus/[goalId]/page.tsx — delete button on focused task, same soft-delete + undo flow

**Checkpoint**: Task deletion with undo fully functional — both P1 stories complete

---

## Phase 5: User Story 3 — Inbox Capture (Priority: P2)

**Goal**: Users have a universal inbox for quick task capture; items can be triaged to goals or deleted; badge shows unprocessed count.

**Independent Test**: Add 3 items to inbox, verify badge shows 3, assign one to a goal, verify count drops to 2 and task appears in goal.

### Implementation for User Story 3

- [ ] T028 [US3] Create inbox tRPC router in packages/core/src/router/inbox.ts — implement create, list, count, assignToGoal, and delete procedures per contracts/api.md
- [ ] T029 [US3] Register inbox router in packages/core/src/router/index.ts — merge inboxRouter into appRouter
- [ ] T030 [P] [US3] Create inbox-capture.tsx component in packages/web/src/components/inbox-capture.tsx — text input with Enter-to-submit, calls inbox.create mutation, auto-focus, minimal UI for speed
- [ ] T031 [P] [US3] Create inbox-badge.tsx component in packages/web/src/components/inbox-badge.tsx — displays unprocessed count from inbox.count query, hides when count is 0, updates in real-time via query invalidation
- [ ] T032 [P] [US3] Create inbox-item.tsx component in packages/web/src/components/inbox-item.tsx — displays item title and created date, goal assignment dropdown (select from existing goals), delete button
- [ ] T033 [US3] Create inbox page at packages/web/src/app/inbox/page.tsx — lists unprocessed inbox items using inbox.list, includes inbox-capture at top, shows empty state when no items, goal assignment triggers inbox.assignToGoal and creates task
- [ ] T034 [US3] Add inbox link with badge to nav in packages/web/src/app/layout.tsx — inbox icon + inbox-badge component in navigation bar, visible from all pages
- [ ] T035 [US3] Add global quick-capture shortcut — keyboard shortcut (e.g., Ctrl+K or Ctrl+Shift+I) opens inbox-capture overlay from any page

**Checkpoint**: Inbox capture and triage fully functional

---

## Phase 6: User Story 4 — Calendar View and Scheduling (Priority: P2)

**Goal**: Users see a weekly calendar with task time blocks; tasks can be dragged from sidebar to schedule, resized, and moved between slots.

**Independent Test**: Drag a task from sidebar onto Wednesday at 2pm, verify block appears, resize to 1 hour, refresh to verify persistence.

### Implementation for User Story 4

- [ ] T036 [US4] Add `task.schedule` tRPC procedure to packages/core/src/router/task.ts — sets scheduledDate, scheduledStart, scheduledDuration with validation per contracts/api.md
- [ ] T037 [P] [US4] Add `task.unschedule` tRPC procedure to packages/core/src/router/task.ts — clears scheduling columns
- [ ] T038 [P] [US4] Add `task.getScheduled` tRPC procedure to packages/core/src/router/task.ts — returns all scheduled tasks for a date range with goal titles, joins goals table
- [ ] T039 [US4] Create calendar-view.tsx component in packages/web/src/components/calendar-view.tsx — FullCalendar wrapper with timeGridWeek and timeGridDay views, editable=true for drag/resize, event handlers for eventDrop and eventResize that call task.schedule mutation
- [ ] T040 [US4] Create calendar-sidebar.tsx component in packages/web/src/components/calendar-sidebar.tsx — lists unscheduled tasks grouped by goal, each item is a Pragmatic Drag and Drop draggable that can be dropped onto the FullCalendar (external drop via @fullcalendar/interaction Draggable)
- [ ] T041 [US4] Create calendar page at packages/web/src/app/calendar/page.tsx — layout with calendar-sidebar on left and calendar-view on right, fetches scheduled tasks via task.getScheduled for current week, default 30-minute duration when dropping from sidebar
- [ ] T042 [US4] Implement weekly-to-daily view switching in calendar-view.tsx — clicking a day header switches to timeGridDay view for that day, back button returns to weekly view
- [ ] T043 [US4] Add task completion from calendar in calendar-view.tsx — clicking a scheduled task block shows a "Mark Done" action, calls existing task completion procedure, updates block to completed visual state
- [ ] T044 [US4] Add calendar link to nav in packages/web/src/app/layout.tsx — calendar icon in navigation bar
- [ ] T045 [US4] Ensure deleted tasks remove calendar blocks — when task.softDelete clears scheduling columns (T020), calendar view query excludes soft-deleted tasks in task.getScheduled

**Checkpoint**: Calendar scheduling fully functional — all P2 stories complete

---

## Phase 7: User Story 5 — Daily Planning Ritual (Priority: P3)

**Goal**: Guided daily planning flow: review yesterday's unfinished tasks, select today's tasks, estimate time, get overcommitment warnings.

**Independent Test**: Trigger planning flow, select 3 tasks, assign time estimates, verify overcommitment warning when total exceeds 6 hours.

### Implementation for User Story 5

- [ ] T046 [US5] Create daily-plan tRPC router in packages/core/src/router/daily-plan.ts — implement start, updateSelections, confirm, and skip procedures per contracts/api.md
- [ ] T047 [US5] Register dailyPlan router in packages/core/src/router/index.ts — merge dailyPlanRouter into appRouter
- [ ] T048 [US5] Create daily-plan service in packages/core/src/services/daily-plan.ts — overcommitment calculation (sum estimatedMinutes vs threshold), yesterday's unfinished task query (tasks scheduled for yesterday with status != completed), carryover logic
- [ ] T049 [P] [US5] Create overcommit-warning.tsx component in packages/web/src/components/overcommit-warning.tsx — displays warning banner when isOvercommitted is true, shows "overcommitted by X minutes", updates reactively as selections change
- [ ] T050 [US5] Create daily-planner.tsx component in packages/web/src/components/daily-planner.tsx — multi-step flow: (1) show yesterday's unfinished tasks with keep/defer/remove options, (2) select tasks for today with time estimates, (3) show total workload + overcommit warning, (4) confirm button
- [ ] T051 [US5] Create daily planning page at packages/web/src/app/plan/page.tsx — calls dailyPlan.start on mount to get/create today's plan, renders daily-planner component, redirects to dashboard on confirm or skip
- [ ] T052 [US5] Add daily planning prompt to dashboard at packages/web/src/app/page.tsx — on page load, check if today's plan exists and is confirmed; if not, show banner prompting user to start daily planning (link to /plan); if confirmed, show normal dashboard
- [ ] T053 [US5] Add manual re-trigger for daily planning — "Plan My Day" button in dashboard header that navigates to /plan even if today's plan is already confirmed

**Checkpoint**: Daily planning ritual complete — all user stories functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T054 [P] Add loading states for drag-and-drop reorder persistence in packages/web/src/components/sortable-task-list.tsx — optimistic update with rollback on error
- [ ] T055 [P] Add loading states for calendar drag/resize in packages/web/src/components/calendar-view.tsx — optimistic update with rollback on error
- [ ] T056 Style calendar view with Tailwind CSS overrides in packages/web/src/app/calendar/page.tsx — match Clarity dark/light theme, consistent colors for task blocks by goal
- [ ] T057 Style inbox page with Tailwind CSS in packages/web/src/app/inbox/page.tsx — match existing Clarity design patterns, empty state illustration
- [ ] T058 Add keyboard accessibility for drag-and-drop in sortable-task-list.tsx — arrow keys to move tasks up/down when focused, Enter to confirm position
- [ ] T059 Run quickstart.md validation — follow all verification steps in specs/002-task-management-ui/quickstart.md end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001–T003 for deps) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no other story dependencies
- **US2 (Phase 4)**: Depends on Phase 2 — no other story dependencies (can run parallel with US1)
- **US3 (Phase 5)**: Depends on Phase 2 — no other story dependencies
- **US4 (Phase 6)**: Depends on Phase 2 — benefits from US2 (soft-delete awareness in T045) but independently testable
- **US5 (Phase 7)**: Depends on Phase 2 — benefits from US4 (calendar integration in T051) but independently testable
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — drag-and-drop reordering stands alone
- **US2 (P1)**: Independent — deletion/undo stands alone
- **US3 (P2)**: Independent — inbox capture and triage stands alone
- **US4 (P2)**: Independent — calendar view stands alone; integrates with soft-delete from US2 but works without it
- **US5 (P3)**: Soft dependency on US4 (confirmed plan → tasks on calendar); works without calendar (tasks just get selected, not scheduled)

### Within Each User Story

- tRPC procedures before UI components
- Components before pages
- Core interactions before edge cases

### Parallel Opportunities

- T001, T002, T003 can run in parallel (independent package installs)
- T010, T011, T012 can run in parallel (independent type files)
- US1 and US2 can run in parallel after Phase 2 (different files, different concerns)
- US3 and US4 can run in parallel after Phase 2 (different routers, different components)
- T030, T031, T032 within US3 can run in parallel (independent components)
- T037, T038 within US4 can run in parallel (independent procedures)

---

## Parallel Example: User Story 1

```bash
# Launch US1 tRPC procedure first (required by components):
Task: "T014 — Add task.reorder tRPC procedure"

# Then launch UI components in parallel:
Task: "T015 — Create sortable-task-list.tsx"
Task: "T016 — Add drag handle to task-item.tsx"
```

## Parallel Example: User Story 3

```bash
# Launch tRPC router first (required by components):
Task: "T028 — Create inbox tRPC router"
Task: "T029 — Register inbox router"

# Then launch all three components in parallel:
Task: "T030 — Create inbox-capture.tsx"
Task: "T031 — Create inbox-badge.tsx"
Task: "T032 — Create inbox-item.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T013)
3. Complete Phase 3: US1 — Drag-and-Drop (T014–T019)
4. Complete Phase 4: US2 — Quick Deletion (T020–T027)
5. **STOP and VALIDATE**: Test reordering and deletion independently
6. Deploy/demo — core task management is usable

### Incremental Delivery

1. Setup + Foundational → Schema and types ready
2. US1 + US2 → Core interactions (MVP!)
3. US3 → Inbox capture adds quick-entry workflow
4. US4 → Calendar adds time-blocking capability
5. US5 → Daily planning ties everything together
6. Polish → Loading states, accessibility, theming

### Parallel Strategy

With capacity for parallel work:

1. Complete Setup + Foundational together
2. Once Foundational is done:
   - Stream A: US1 (drag-and-drop) + US2 (deletion)
   - Stream B: US3 (inbox) + US4 (calendar)
3. US5 (daily planning) after US4 completes
4. Polish phase last

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All tRPC procedures use Zod validation for inputs
- Soft-delete uses deleted_at column — queries must filter WHERE deleted_at IS NULL
