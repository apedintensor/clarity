# Implementation Plan: Task Management UI

**Branch**: `002-task-management-ui` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-task-management-ui/spec.md`

## Summary

This feature adds interactive task management to Clarity: drag-and-
drop reordering for tasks and subtasks, quick deletion with undo,
a Todoist-style inbox for frictionless task capture, a Sunsama-
inspired weekly/daily calendar with time-blocking, and a guided
daily planning ritual with overcommitment warnings. The frontend
uses Pragmatic Drag and Drop (Atlassian) for list interactions and
FullCalendar v7 for the calendar. All business logic flows through
new tRPC procedures in `packages/core`.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), tRPC v11, Drizzle ORM, Pragmatic Drag and Drop, FullCalendar v7, Sonner
**Storage**: SQLite (via better-sqlite3 + Drizzle ORM)
**Testing**: Vitest (unit/integration), Playwright (e2e)
**Target Platform**: Local development machine (localhost)
**Project Type**: Web application (monorepo with CLI)
**Performance Goals**: <200ms p95 for non-AI API calls, <100ms for drag-drop reorder persistence, 60fps drag animations
**Constraints**: Local-only, single user, no new external APIs
**Scale/Scope**: Single user, ~10 active goals, ~100 active tasks, ~50 inbox items, 1 week calendar view

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Monorepo Package Isolation | New UI goes in `web`, new routers in `core`, schema changes in `db`, new types in `types`. No new packages needed. | PASS |
| II. Shared Core via tRPC | All business logic (reorder, delete, inbox CRUD, scheduling, daily plan) exposed as tRPC procedures in `core/src/router/`. Web consumes via tRPC client. | PASS |
| III. Type Safety First | New Zod schemas for all procedure inputs. New Drizzle tables for inbox_items and daily_plans. Shared types in `types/`. | PASS |
| IV. Local-First Single User | No new external services. SQLite only. No auth changes. | PASS |
| V. Spec-Driven Development | spec.md, plan.md, research.md, data-model.md, contracts/api.md, quickstart.md all produced before implementation. | PASS |

No violations. Complexity Tracking section not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-task-management-ui/
├── plan.md              # This file
├── research.md          # Phase 0 — library decisions
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — setup guide
├── contracts/
│   └── api.md           # Phase 1 — tRPC procedure contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/
├── web/
│   └── src/
│       ├── app/
│       │   ├── inbox/
│       │   │   └── page.tsx            # Inbox view
│       │   ├── calendar/
│       │   │   └── page.tsx            # Weekly/daily calendar
│       │   ├── plan/
│       │   │   └── page.tsx            # Daily planning ritual
│       │   ├── goal/[id]/
│       │   │   └── page.tsx            # (existing — add DnD + delete)
│       │   └── focus/[goalId]/
│       │       └── page.tsx            # (existing — add delete)
│       ├── components/
│       │   ├── task-item.tsx           # (existing — add drag handle + delete button)
│       │   ├── sortable-task-list.tsx  # New: DnD-enabled task list
│       │   ├── inbox-capture.tsx       # New: quick-capture input
│       │   ├── inbox-badge.tsx         # New: unprocessed count badge
│       │   ├── inbox-item.tsx          # New: inbox item row
│       │   ├── calendar-view.tsx       # New: FullCalendar wrapper
│       │   ├── calendar-sidebar.tsx    # New: draggable task sidebar
│       │   ├── daily-planner.tsx       # New: planning ritual flow
│       │   ├── overcommit-warning.tsx  # New: workload warning
│       │   └── delete-confirm.tsx      # New: deletion confirmation + undo toast
│       └── lib/
│           └── trpc.ts                 # (existing — no changes)
│
├── core/
│   └── src/
│       ├── router/
│       │   ├── task.ts                 # (existing — add reorder, softDelete, undoDelete, schedule, unschedule, getScheduled)
│       │   ├── inbox.ts               # New: inbox CRUD procedures
│       │   ├── daily-plan.ts          # New: daily planning procedures
│       │   └── index.ts               # (existing — register new routers)
│       └── services/
│           └── daily-plan.ts          # New: overcommitment calculation, carryover logic
│
├── db/
│   └── src/
│       └── schema.ts                  # (existing — add inbox_items, daily_plans tables + task columns)
│
└── types/
    └── src/
        ├── inbox.ts                   # New: InboxItem types
        ├── daily-plan.ts              # New: DailyPlan types
        ├── task.ts                    # (existing — add schedule fields)
        └── index.ts                   # (existing — re-export new types)
```

**Structure Decision**: Same monorepo structure as 001. All changes
fit within existing packages. New router files (`inbox.ts`,
`daily-plan.ts`) follow the 1:1 domain mapping convention. New
components follow the flat component directory convention. Three new
pages (`/inbox`, `/calendar`, `/plan`) added under `app/`.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.
