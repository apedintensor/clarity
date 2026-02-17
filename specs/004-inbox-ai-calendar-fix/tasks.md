# Tasks: Inbox AI Chat & Calendar Fixes

**Input**: Design documents from `/specs/004-inbox-ai-calendar-fix/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story. US1 (Inbox AI Chat) and US6 (Inbox Conversion) share inbox files. US2-US5 (Calendar fixes) share calendar files. Setup phase handles all schema/type changes needed across stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Paths are relative to repository root

---

## Phase 1: Setup (Schema, Types & Shared Infrastructure)

**Purpose**: Database schema changes, shared types, and color palette needed by all user stories

- [X] T001 Add `conversations` and `conversationMessages` tables, add `colorIndex` column to goals table, add `parentTaskId` column to tasks table in packages/db/src/schema.ts
- [X] T002 [P] Create Conversation and ConversationMessage types in packages/types/src/conversation.ts
- [X] T003 [P] Update Goal type to include `colorIndex: number` field in packages/types/src/goal.ts
- [X] T004 [P] Update Task type to include `parentTaskId: string | null` field in packages/types/src/task.ts
- [X] T005 [P] Re-export conversation types from packages/types/src/index.ts
- [X] T006 [P] Create goal color palette constant (10 colors) and `getGoalColor(colorIndex)` helper in packages/web/src/lib/goal-colors.ts
- [X] T007 Apply schema changes by running `pnpm db:push` from repository root

---

## Phase 2: US1 — Inbox AI Chat Experience (Priority: P1) 🎯 MVP

**Goal**: Transform inbox item double-click into an AI-powered streaming chat that helps brainstorm, challenge limiting beliefs, and generate structured goal/task suggestions

**Independent Test**: Double-click inbox item → AI chat modal opens → have conversation → ask for goal suggestions → accept a suggestion → goal appears on dashboard

### Router & AI Changes

- [X] T008 [US1] Create `conversation.getOrCreate` procedure (returns or creates conversation for an inbox item with all messages) in packages/core/src/router/conversation.ts
- [X] T009 [US1] Add `conversation.addMessage` and `conversation.saveAssistantMessage` procedures in packages/core/src/router/conversation.ts
- [X] T010 [US1] Create streaming AI chat logic with system prompt for brainstorming/coaching in packages/core/src/ai/inbox-chat.ts
- [X] T011 [US1] Create Next.js API route for streaming AI responses using `streamText()` in packages/web/src/app/api/chat/route.ts
- [X] T012 [US1] Add `inbox.acceptSuggestion` procedure (creates goal + tasks from AI suggestion, assigns colorIndex, optionally soft-deletes inbox item) in packages/core/src/router/inbox.ts

### UI Changes

- [X] T013 [US1] Create `<AISuggestionCard>` component displaying a goal/task suggestion with Accept, Modify, Reject buttons in packages/web/src/components/ai-suggestion-card.tsx
- [X] T014 [US1] Create `<InboxChatModal>` component with chat message history, streaming message display, suggestion card rendering, using Vercel AI SDK `useChat` hook in packages/web/src/components/inbox-chat-modal.tsx
- [X] T015 [US1] Update inbox-item.tsx to open `<InboxChatModal>` on double-click instead of the read-only detail modal in packages/web/src/components/inbox-item.tsx
- [X] T016 [US1] Wire conversation router into tRPC app router in packages/core/src/router/index.ts (or wherever routers are merged)

**Checkpoint**: Inbox AI chat functional — users can brainstorm with AI and generate goals from inbox items

---

## Phase 3: US6 — Inbox Item Conversion to Goal/Task/Subtask (Priority: P1)

**Goal**: Add right-click context menu options to directly convert inbox items into goals, tasks, or subtasks without AI chat

**Independent Test**: Right-click inbox item → "Convert to Goal" → goal created on dashboard. Right-click → "Convert to Task" → pick goal → task created. Right-click → "Convert to Subtask" → pick goal → pick task → subtask created.

### Router Changes

- [X] T017 [US6] Add `inbox.convertToGoal` procedure (creates goal with inbox item title, assigns colorIndex, soft-deletes inbox item) in packages/core/src/router/inbox.ts
- [X] T018 [US6] Add `inbox.convertToTask` procedure (creates task under selected goal, soft-deletes inbox item) in packages/core/src/router/inbox.ts
- [X] T019 [US6] Add `inbox.convertToSubtask` procedure (creates task with parentTaskId under selected task, soft-deletes inbox item) in packages/core/src/router/inbox.ts

### UI Changes

- [X] T020 [US6] Add "Convert to Goal", "Convert to Task", "Convert to Subtask" items to inbox-item.tsx context menu with inline goal/task pickers in packages/web/src/components/inbox-item.tsx

### Goal Router Changes

- [X] T021 [US6] Modify `goal.create` to assign `colorIndex` as `(count of existing goals) % 10` in packages/core/src/router/goal.ts
- [X] T022 [US6] Modify `goal.list` to include `colorIndex` in returned goal objects in packages/core/src/router/goal.ts

**Checkpoint**: Inbox items can be converted to goals, tasks, or subtasks via right-click menu

---

## Phase 4: US2 — Calendar: Show All Tasks from All Goals (Priority: P1)

**Goal**: Fix calendar to reliably display every scheduled task from every active goal, and show unscheduled tasks in the sidebar

**Independent Test**: Create 3 goals with 2 tasks each, schedule all → calendar shows all 6 tasks. Add unscheduled task → appears in sidebar.

### Router Changes

- [X] T023 [US2] Fix `task.getScheduled` to ensure all scheduled tasks from all active, non-deleted goals are returned, and add `goalColorIndex` to output in packages/core/src/router/task.ts
- [X] T024 [US2] Add `task.update` procedure (update title, description, scheduledDate, scheduledStart, scheduledDuration, estimatedMinutes) in packages/core/src/router/task.ts

### UI Changes

- [X] T025 [US2] Update calendar-view.tsx to pass `goalColorIndex` through to event rendering in packages/web/src/components/calendar-view.tsx
- [X] T026 [US2] Update calendar-sidebar.tsx to show all unscheduled tasks from all active goals grouped by goal in packages/web/src/components/calendar-sidebar.tsx

**Checkpoint**: Calendar reliably shows all tasks from all goals

---

## Phase 5: US5 — Calendar: Monday as First Day of Week (Priority: P2)

**Goal**: Set Monday as the first column in calendar week view

**Independent Test**: Open calendar in week view → Monday is first column → Sunday is last column

- [X] T027 [US5] Set `firstDay: 1` in FullCalendar config in packages/web/src/components/calendar-view.tsx
- [X] T028 [US5] Fix date range calculation in calendar/page.tsx to compute Monday-based week boundaries in packages/web/src/app/calendar/page.tsx

**Checkpoint**: Calendar week view starts on Monday

---

## Phase 6: US4 — Calendar: Goal-Based Color Coding (Priority: P2)

**Goal**: Color-code calendar events by goal using a 10-color palette, with muted variants for completed tasks

**Independent Test**: Schedule tasks from 3+ goals → each goal's tasks have a distinct color → completed tasks show muted variant

- [X] T029 [US4] Update calendar-view.tsx event rendering to use `getGoalColor(goalColorIndex)` for event background color, and apply muted/faded style + strikethrough for completed tasks in packages/web/src/components/calendar-view.tsx
- [X] T030 [US4] Update calendar-sidebar.tsx to show color indicators matching each goal's calendar color in packages/web/src/components/calendar-sidebar.tsx

**Checkpoint**: Calendar events are color-coded by goal

---

## Phase 7: US3 — Calendar: Right-Click Context Menu on Events (Priority: P2)

**Goal**: Add right-click context menu to calendar events with Edit, Reschedule, Complete, Delete actions

**Independent Test**: Right-click calendar event → menu appears → Edit opens modal → Complete marks task done → Delete with undo toast

### UI Changes

- [X] T031 [US3] Create `<CalendarTaskEditModal>` component with editable fields (title, description, scheduled date/time, duration) using `<Modal>` in packages/web/src/components/calendar-task-edit-modal.tsx
- [X] T032 [US3] Create `<CalendarEventMenu>` component (context menu with Edit, Reschedule, Complete, Delete options) in packages/web/src/components/calendar-event-menu.tsx
- [X] T033 [US3] Add `eventDidMount` callback in calendar-view.tsx to attach right-click context menu listener on each event DOM element, integrate CalendarEventMenu and CalendarTaskEditModal in packages/web/src/components/calendar-view.tsx
- [X] T034 [US3] Implement Reschedule action with date/time picker in CalendarEventMenu (reuses task.schedule mutation) in packages/web/src/components/calendar-event-menu.tsx
- [X] T035 [US3] Implement Delete action with soft-delete + 5-second undo toast in CalendarEventMenu in packages/web/src/components/calendar-event-menu.tsx

**Checkpoint**: Calendar events support full right-click interaction (edit, reschedule, complete, delete)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, cleanup, and edge case handling

- [X] T036 Verify full build passes with `pnpm -r run build` and fix any type errors
- [X] T037 Verify lint passes with `pnpm -r run lint` and fix any issues
- [ ] T038 Run quickstart.md scenarios 1–15 and verify all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (schema + types must exist)
- **US6 (Phase 3)**: Depends on Phase 1 (needs parentTaskId in tasks, colorIndex in goals)
- **US2 (Phase 4)**: Depends on Phase 1 (needs colorIndex in goals for getScheduled output)
- **US5 (Phase 5)**: No dependencies beyond Phase 1 (config-only change)
- **US4 (Phase 6)**: Depends on Phase 4 (needs goalColorIndex in calendar-view.tsx events)
- **US3 (Phase 7)**: Depends on Phase 4 (needs task.update procedure) and Phase 6 (calendar-view.tsx color changes)
- **Polish (Phase 8)**: Depends on all previous phases

### User Story Dependencies

```
Phase 1 (Setup)
  ├─► Phase 2 (US1 Inbox AI Chat)
  ├─► Phase 3 (US6 Inbox Conversion)
  ├─► Phase 4 (US2 Calendar All Tasks)
  │     └─► Phase 6 (US4 Goal Colors)
  │           └─► Phase 7 (US3 Right-Click Menu)
  └─► Phase 5 (US5 Monday Start)
                    └─► Phase 8 (Polish)
```

### File Dependency Map (same-file conflicts)

| File | Phases that modify it | Must be sequential |
|------|-----------------------|-------------------|
| packages/core/src/router/inbox.ts | US1 (T012), US6 (T017–T019) | US1 → US6 |
| packages/core/src/router/task.ts | US2 (T023–T024) | Single phase |
| packages/core/src/router/goal.ts | US6 (T021–T022) | Single phase |
| packages/web/src/components/inbox-item.tsx | US1 (T015), US6 (T020) | US1 → US6 |
| packages/web/src/components/calendar-view.tsx | US2 (T025), US5 (T027), US4 (T029), US3 (T033) | US2 → US5 → US4 → US3 |
| packages/web/src/components/calendar-sidebar.tsx | US2 (T026), US4 (T030) | US2 → US4 |
| packages/web/src/app/calendar/page.tsx | US5 (T028) | Single phase |

### Parallel Opportunities

**Within Phase 1**:
```
T001 (schema) → T002 [P] + T003 [P] + T004 [P] + T005 [P] + T006 [P] → T007 (db:push)
```

**After Phase 1, these can run in parallel**:
```
Phase 2 (US1 Inbox AI Chat) ║ Phase 4 (US2 Calendar All Tasks) ║ Phase 5 (US5 Monday Start)
```
Note: US1 and US6 share inbox files (must be sequential US1→US6). US2, US5, US4, US3 share calendar files (must be sequential).

**Within Phase 2 (US1)**:
```
T008 + T009 [P] (conversation router) → T010 (AI chat logic) → T011 (API route) + T012 (acceptSuggestion)
T013 [P] (suggestion card) → T014 (chat modal) → T015 (inbox-item update) + T016 (router wiring)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (schema + types + color palette)
2. Complete Phase 2: US1 Inbox AI Chat
3. Complete Phase 4: US2 Calendar All Tasks
4. **STOP and VALIDATE**: Test AI chat and calendar independently
5. The app now has AI-powered inbox brainstorming and a working calendar

### Incremental Delivery

1. Setup → Foundation ready
2. Add US1 (Inbox AI Chat) → Test → **Core MVP delivered**
3. Add US6 (Inbox Conversion) → Test → Full inbox management
4. Add US2 (Calendar All Tasks) → Test → Calendar reliability fixed
5. Add US5 (Monday Start) → Test → Calendar layout fixed
6. Add US4 (Goal Colors) → Test → Calendar visual improvement
7. Add US3 (Right-Click Menu) → Test → Calendar full interaction
8. Polish → Build/lint verification, quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- US1 requires a Next.js API route (`/api/chat`) bypassing tRPC for streaming — documented in plan.md Complexity Tracking
- Calendar story ordering (US2→US5→US4→US3) is driven by same-file dependencies in calendar-view.tsx
- The AI system prompt (T010) is critical for quality — it defines the brainstorming/coaching behavior
- `colorIndex` assignment uses `(count of existing goals) % 10` to cycle through the palette
- `parentTaskId` supports one level of subtask nesting only
