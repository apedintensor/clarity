---

description: "Task list for Braindump to Action feature implementation"
---

# Tasks: Braindump to Action

**Input**: Design documents from `/specs/001-braindump-to-action/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md

**Tests**: Not explicitly requested in the feature spec. Tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `packages/web/`, `packages/cli/`, `packages/core/`, `packages/db/`, `packages/types/`
- Paths are relative to repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the monorepo, install dependencies, configure tooling

- [X] T001 Initialize pnpm monorepo with pnpm-workspace.yaml and turbo.json at repository root
- [X] T002 Create packages/types/ package with package.json and tsconfig.json, define shared TypeScript types for BrainDump, Goal, Task, Clarification, ProgressRecord, and User in packages/types/src/
- [X] T003 [P] Create packages/db/ package with package.json and tsconfig.json, configure Drizzle ORM with better-sqlite3 driver in packages/db/src/index.ts
- [X] T004 [P] Configure ESLint, Prettier, and TypeScript strict mode in root config files (eslint.config.js, .prettierrc, tsconfig.base.json)
- [X] T005 Create .env.example with GEMINI_API_KEY and DATABASE_URL variables, add .env to .gitignore

**Checkpoint**: Monorepo builds, lints, and types compile across all packages

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, tRPC setup, and shared infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Define complete Drizzle schema for all entities (User, BrainDump, Goal, Task, Clarification, ProgressRecord) with indexes in packages/db/src/schema.ts per data-model.md
- [X] T007 Implement database connection with WAL mode and migration runner in packages/db/src/index.ts and packages/db/src/migrate.ts
- [X] T008 Create packages/core/ package with tRPC initialization, context creation, and root router in packages/core/src/trpc.ts and packages/core/src/router/index.ts
- [X] T009 [P] Implement user.getOrCreate and user.updatePreferences tRPC procedures in packages/core/src/router/user.ts (auto-creates single user on first access)
- [X] T010 [P] Create packages/web/ with Next.js 15 App Router, Tailwind CSS, tRPC client setup in packages/web/src/lib/trpc.ts, and tRPC HTTP handler in packages/web/src/app/api/trpc/[trpc]/route.ts
- [X] T011 [P] Create packages/cli/ with Commander entry point in packages/cli/src/index.ts, configure bin field in package.json, implement --json and --help global flags, and output utilities in packages/cli/src/utils/output.ts
- [X] T012 Create root layout in packages/web/src/app/layout.tsx with tRPC provider, Tailwind globals in packages/web/src/styles/globals.css, and navigation shell

**Checkpoint**: Foundation ready — `pnpm dev` starts the web app at localhost:3000, CLI runs `clarity --help`, tRPC procedures callable from both, database schema applied

---

## Phase 3: User Story 1 — Brain Dump Capture (Priority: P1) MVP

**Goal**: Users can dump unstructured thoughts into Clarity and retrieve them later, via both web dashboard and CLI

**Independent Test**: Open the web app, type text into the brain dump input, submit, confirm it's saved. Return later and see it listed. Run `clarity dump "my thoughts"` from CLI and confirm same data appears on web.

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement braindump.create mutation (validate rawText not empty, insert into DB, return created dump) in packages/core/src/router/braindump.ts
- [X] T014 [P] [US1] Implement braindump.list query (paginated with cursor, ordered by createdAt DESC) in packages/core/src/router/braindump.ts
- [X] T015 [P] [US1] Implement braindump.get query (fetch single dump by ID with NOT_FOUND error) in packages/core/src/router/braindump.ts
- [X] T016 [US1] Implement braindump.update mutation (append text to existing dump) in packages/core/src/router/braindump.ts
- [X] T017 [US1] Build brain dump capture page with large textarea, auto-save indicator, and submit confirmation in packages/web/src/app/dump/page.tsx and packages/web/src/components/brain-dump-input.tsx
- [X] T018 [US1] Build brain dump list view on dashboard showing all previous dumps with timestamps in packages/web/src/app/page.tsx
- [X] T019 [US1] Implement `clarity dump <text>` CLI command with stdin pipe support in packages/cli/src/commands/dump.ts
- [X] T020 [US1] Implement `clarity dumps` CLI command with --limit and --json flags in packages/cli/src/commands/dump.ts

**Checkpoint**: Brain dump capture works end-to-end in both web and CLI. Data persists and syncs via shared SQLite.

---

## Phase 4: User Story 2 — AI-Powered Clarification & Organization (Priority: P2)

**Goal**: AI analyzes a brain dump, identifies themes and goals, asks clarification questions, and produces organized goals with purpose statements

**Independent Test**: Take a saved brain dump, trigger AI processing, see organized themes and suggested goals. Answer clarification questions and verify the summary refines. Confirm goals have purpose statements (the "why").

### Implementation for User Story 2

- [X] T021 [P] [US2] Create AI prompt templates for brain dump analysis (theme extraction, goal identification, purpose generation) in packages/core/src/ai/prompts.ts
- [X] T022 [P] [US2] Implement brain-dump-analyzer using Vercel AI SDK with @ai-sdk/google (Gemini) for streaming theme/goal extraction in packages/core/src/ai/brain-dump-analyzer.ts
- [X] T023 [P] [US2] Implement clarifier for generating up to 5 targeted clarification questions with suggested answers in packages/core/src/ai/clarifier.ts
- [X] T024 [US2] Implement braindump.process mutation (streaming, sets status processing→organized, creates Clarification and Goal records) in packages/core/src/router/braindump.ts
- [X] T025 [P] [US2] Implement clarification.answer, clarification.skip, and clarification.answerAll procedures in packages/core/src/router/clarification.ts
- [X] T026 [P] [US2] Implement goal.create (from AI suggestion or manual) and goal.list procedures in packages/core/src/router/goal.ts
- [X] T027 [US2] Implement goal.get (with tasks) and goal.update (title, purpose, status, archive) procedures in packages/core/src/router/goal.ts
- [X] T028 [US2] Build brain dump processing page with streaming AI results, clarification Q&A chat UI, and organized goal display in packages/web/src/app/dump/[id]/page.tsx and packages/web/src/components/clarification-chat.tsx
- [X] T029 [US2] Build goal card component with title, purpose, and status in packages/web/src/components/goal-card.tsx
- [X] T030 [US2] Implement `clarity process <id>` CLI command with interactive clarification prompts in packages/cli/src/commands/process.ts
- [X] T031 [US2] Implement `clarity goals` CLI command with --status and --json flags in packages/cli/src/commands/goals.ts
- [X] T032 [US2] Implement `clarity goal <id>` CLI command showing goal details in packages/cli/src/commands/goals.ts
- [X] T033 [US2] Add manual edit capability for AI-generated summaries and goal structures on packages/web/src/app/dump/[id]/page.tsx (editable fields for summary, goal titles, purpose statements)

**Checkpoint**: Full AI pipeline works — dump → process → clarify → organized goals with purpose. Both web and CLI functional independently.

---

## Phase 5: User Story 3 — Task Breakdown & Action Plan (Priority: P3)

**Goal**: AI decomposes goals into specific, time-bounded tasks (25-90 min) with done definitions, ordered by dependency

**Independent Test**: Take an organized goal, trigger task breakdown, verify each generated task has a title, description, done definition, estimated duration, and sort order. Verify tasks over 90 min are auto-split.

### Implementation for User Story 3

- [X] T034 [US3] Implement task-decomposer using Vercel AI SDK for streaming goal→task breakdown with duration estimation and dependency detection in packages/core/src/ai/task-decomposer.ts
- [X] T035 [US3] Implement goal.breakdown mutation (streaming, creates Task records, auto-splits tasks >90 min) in packages/core/src/router/goal.ts
- [X] T036 [P] [US3] Implement task.list query (ordered by sortOrder within goal) and task.update mutation (edit title, description, doneDefinition, estimatedMinutes, status, sortOrder) in packages/core/src/router/task.ts
- [X] T037 [US3] Build goal detail page with task list showing title, duration, done definition, status, and dependency indicators in packages/web/src/app/goal/[id]/page.tsx and packages/web/src/components/task-item.tsx
- [X] T038 [US3] Add inline task editing on goal detail page (edit task title, description, done definition, duration) in packages/web/src/components/task-item.tsx
- [X] T039 [US3] Implement `clarity breakdown <goalId>` CLI command with streaming output in packages/cli/src/commands/breakdown.ts
- [X] T040 [US3] Implement `clarity tasks <goalId>` CLI command with --json flag in packages/cli/src/commands/breakdown.ts

**Checkpoint**: Goals decompose into actionable task lists. Tasks are editable. CLI outputs human-readable and JSON formats.

---

## Phase 6: User Story 4 — Flow-State Task Execution (Priority: P4)

**Goal**: Focus mode displays one task at a time, auto-advances on completion, eliminates context switching

**Independent Test**: Enter focus mode for a goal, see only the current task with its done definition and timer. Mark it complete, verify the next task appears automatically with a celebration moment. Exit and resume later from same position.

### Implementation for User Story 4

- [X] T041 [US4] Implement task.getNext query (find first pending task with completed dependencies, return position and progress) in packages/core/src/router/task.ts
- [X] T042 [US4] Implement task.complete mutation (set completed, recalculate goal progress, return next task) in packages/core/src/router/task.ts
- [X] T043 [US4] Build focus mode page with single-task display, done definition, session timer, and distraction-free layout in packages/web/src/app/focus/[goalId]/page.tsx and packages/web/src/components/focus-view.tsx
- [X] T044 [P] [US4] Build timer component (counts up, shows elapsed session time) in packages/web/src/components/timer.tsx
- [X] T045 [US4] Implement auto-advance flow — on task completion, show brief celebration then present next task without navigation in packages/web/src/components/focus-view.tsx
- [X] T046 [US4] Implement pause/resume — exit focus mode preserves position, re-entering resumes from last incomplete task in packages/web/src/app/focus/[goalId]/page.tsx
- [X] T047 [US4] Implement `clarity focus <goalId>` CLI command with interactive loop (displays task, waits for "done" input, advances) in packages/cli/src/commands/focus.ts
- [X] T048 [US4] Implement `clarity done <taskId>` CLI command for quick task completion in packages/cli/src/commands/done.ts

**Checkpoint**: Focus mode delivers single-task flow experience with auto-advance. Works in both web and CLI.

---

## Phase 7: User Story 5 — Progress & Positive Reinforcement (Priority: P5)

**Goal**: Track progress, streaks, milestones. Deliver varied positive reinforcement on every completion. Dashboard shows overview.

**Independent Test**: Complete several tasks across multiple days. Verify progress bars update, streak counter increments, milestone celebrations appear at 25/50/75/100%, and reinforcement messages vary.

### Implementation for User Story 5

- [X] T049 [P] [US5] Implement streak calculation service (consecutive days with completions, update current/longest streak) in packages/core/src/services/streak.ts
- [X] T050 [P] [US5] Implement milestone detection service (detect when goal progress crosses 25/50/75/100% thresholds) in packages/core/src/services/milestone.ts
- [X] T051 [P] [US5] Implement reinforcement message service with varied message pool per type (completion, milestone, streak, return), variable selection to avoid repetition in packages/core/src/services/reinforcement.ts
- [X] T052 [US5] Implement reinforcement.getMessage tRPC procedure in packages/core/src/router/reinforcement.ts
- [X] T053 [US5] Implement progress.dashboard query (active goals with task counts, streak data, today's activity, recent completions, weekly activity) in packages/core/src/router/progress.ts
- [X] T054 [US5] Implement progress.history query (historical records, totals, averages) in packages/core/src/router/progress.ts
- [X] T055 [US5] Integrate streak, milestone, and reinforcement services into task.complete mutation — return reinforcement message, milestone info, and updated streak with every completion in packages/core/src/router/task.ts
- [X] T056 [P] [US5] Build progress bar component (reusable, shows percentage with visual indicator) in packages/web/src/components/progress-bar.tsx
- [X] T057 [P] [US5] Build streak badge component (current streak count, longest streak, fire icon for active streaks) in packages/web/src/components/streak-badge.tsx
- [X] T058 [P] [US5] Build celebration component (animation/visual moment on task completion, distinct milestone celebration for 25/50/75/100%) in packages/web/src/components/celebration.tsx
- [X] T059 [US5] Update dashboard page (packages/web/src/app/page.tsx) to show goal overview with progress bars, streak badge, today's stats, recent completions, and weekly activity chart
- [X] T060 [US5] Integrate celebration component into focus mode — show celebration on task complete, milestone celebration on threshold crossings in packages/web/src/components/focus-view.tsx
- [X] T061 [US5] Update goal card component to include progress bar in packages/web/src/components/goal-card.tsx
- [X] T062 [US5] Implement `clarity progress` CLI command with formatted dashboard summary (goals, streaks, today's activity) in packages/cli/src/commands/progress.ts
- [X] T063 [US5] Implement `clarity history` CLI command with --days and --json flags in packages/cli/src/commands/progress.ts

**Checkpoint**: Full reinforcement loop operational. Dashboard shows comprehensive progress. Streaks and milestones tracked. Celebrations appear in focus mode and on dashboard.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T064 [P] Add error boundary and user-friendly error pages in packages/web/src/app/error.tsx and packages/web/src/app/not-found.tsx
- [X] T065 [P] Add consistent loading states (skeletons/spinners) across all web pages in packages/web/src/components/
- [X] T066 Implement dark mode / theme preference support based on user.preferences.theme in packages/web/src/app/layout.tsx and packages/web/src/styles/globals.css
- [X] T067 Add CLI interactive prompt helpers (confirm, select, input) in packages/cli/src/utils/prompts.ts for better CLI UX
- [ ] T068 Run quickstart.md validation — follow every step in specs/001-braindump-to-action/quickstart.md and verify the app works as documented
- [X] T069 Add pnpm scripts to root package.json: dev, build, test, db:push, db:studio, cli:link, cli:dev per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — no story dependencies
- **US2 (Phase 4)**: Depends on Foundational — uses BrainDump entity from US1 procedures but does not depend on US1 web/CLI (procedures are in same router file)
- **US3 (Phase 5)**: Depends on Foundational — uses Goal entity from US2 procedures
- **US4 (Phase 6)**: Depends on Foundational — uses Task entity from US3 procedures
- **US5 (Phase 7)**: Depends on Foundational — integrates into task.complete from US4
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — standalone
- **US2 (P2)**: Can start after Phase 2 — builds on braindump procedures but independently testable
- **US3 (P3)**: Can start after Phase 2 — builds on goal procedures but independently testable
- **US4 (P4)**: Can start after Phase 2 — builds on task procedures but independently testable
- **US5 (P5)**: Can start after Phase 2 — integrates into task.complete but independently testable

### Within Each User Story

- Router procedures (core) before web pages
- Router procedures (core) before CLI commands
- Web pages and CLI commands can run in parallel (different packages)

### Parallel Opportunities

- T003, T004 can run in parallel (Setup phase)
- T009, T010, T011 can run in parallel (Foundational phase)
- T013, T014, T015 can run in parallel (US1 router procedures)
- T021, T022, T023 can run in parallel (US2 AI modules)
- T025, T026 can run in parallel (US2 clarification + goal procedures)
- T049, T050, T051 can run in parallel (US5 services)
- T056, T057, T058 can run in parallel (US5 web components)
- T064, T065 can run in parallel (Polish phase)

---

## Parallel Example: User Story 1

```bash
# Launch all router procedures together (no file conflicts):
Task: "T013 braindump.create in packages/core/src/router/braindump.ts"
Task: "T014 braindump.list in packages/core/src/router/braindump.ts"
Task: "T015 braindump.get in packages/core/src/router/braindump.ts"

# After procedures done, launch web and CLI in parallel:
Task: "T017 Brain dump capture page in packages/web/src/app/dump/page.tsx"
Task: "T019 clarity dump CLI command in packages/cli/src/commands/dump.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Brain Dump Capture
4. **STOP and VALIDATE**: Capture brain dumps from web and CLI, verify persistence
5. Demo: "I can dump my thoughts and they're saved"

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1: Brain Dump Capture → "I can externalize my thoughts" (MVP!)
3. US2: AI Clarification → "AI organizes my chaos into goals with purpose"
4. US3: Task Breakdown → "Goals become actionable 25-90 min tasks"
5. US4: Focus Mode → "I work on one task at a time without thinking"
6. US5: Reinforcement → "Every win is celebrated, streaks keep me going"
7. Polish → Error handling, loading states, dark mode

### Each story adds value without breaking previous stories.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All CLI commands support --json flag for machine-readable output
- Web and CLI share the same SQLite database file — no sync mechanism needed
