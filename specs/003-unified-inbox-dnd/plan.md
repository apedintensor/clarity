# Implementation Plan: Unified Inbox & Dashboard DnD

**Branch**: `003-unified-inbox-dnd` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-unified-inbox-dnd/spec.md`

## Summary

Merge the separate Brain Dump and Inbox pages into a single Todoist-style unified Inbox. Add drag-and-drop reordering and deletion (with undo) for both goal cards on the dashboard and inbox items. Introduce a consistent card interaction model: single-click to select, right-click for context menu, double-click to open a detail modal. The goal detail modal replaces the existing goal detail page.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), tRPC v11, Drizzle ORM, @atlaskit/pragmatic-drag-and-drop, Sonner (toasts)
**Storage**: SQLite via better-sqlite3 + Drizzle ORM
**Testing**: Playwright (E2E)
**Target Platform**: Local web app (localhost)
**Project Type**: Monorepo (packages/web, packages/core, packages/db, packages/types)
**Performance Goals**: <200ms p95 for non-AI API calls, drag-and-drop at 60fps
**Constraints**: Single-user, local-first, no authentication
**Scale/Scope**: Single user, ~10-50 goals, ~100-500 inbox items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Monorepo Package Isolation | All changes in correct packages (db→schema, core→routers, web→components/pages, types→interfaces) | PASS |
| II. Shared Core via tRPC | All business logic (reorder, soft-delete, undo) in tRPC router procedures; UI only calls tRPC | PASS |
| III. Type Safety First | Zod validation on all new inputs; shared types in packages/types | PASS |
| IV. Local-First Single User | SQLite only, no auth, no remote services | PASS |
| V. Spec-Driven Development | spec.md complete with 6 user stories, 18 FRs, plan.md being produced now | PASS |

No violations. No new packages required.

## Project Structure

### Documentation (this feature)

```text
specs/003-unified-inbox-dnd/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/db/src/
└── schema.ts                    # Modified: add sortOrder + deletedAt to inboxItems, deletedAt to goals

packages/types/src/
├── inbox.ts                     # Modified: add sortOrder, deletedAt fields
└── goal.ts                      # Modified: add deletedAt field

packages/core/src/router/
├── goal.ts                      # Modified: add reorder, softDelete, undoDelete procedures; filter deletedAt in list/get
├── inbox.ts                     # Modified: add reorder, softDelete, undoDelete, process procedures; add sortOrder support
└── braindump.ts                 # Existing: no changes (brain dump processing flow stays intact)

packages/web/src/components/
├── goal-card.tsx                # Major rewrite: remove Link wrapper, add selection, drag handle, X button, context menu
├── goal-detail-modal.tsx        # New: modal with full goal detail (replaces goal/[id]/page.tsx)
├── inbox-item.tsx               # Major rewrite: add selection, drag handle, X button, context menu, detail modal
├── inbox-detail-modal.tsx       # New: modal for inbox item editing
├── sortable-goal-list.tsx       # New: DnD container for goal cards (mirrors sortable-task-list.tsx pattern)
├── context-menu.tsx             # New: reusable right-click context menu component
├── inbox-capture.tsx            # Existing: no changes
├── inbox-badge.tsx              # Existing: no changes
└── sortable-task-list.tsx       # Existing: reference pattern for DnD

packages/web/src/app/
├── page.tsx                     # Modified: replace static goal list with SortableGoalList, replace "New Brain Dump" link with Inbox link
├── inbox/page.tsx               # Modified: add DnD support, add "Process" action for brain dump flow
├── dump/page.tsx                # Deprecated: redirect to /inbox (or remove)
├── dump/[id]/page.tsx           # Existing: keep for brain dump clarification flow (reached via inbox "Process" action)
└── layout.tsx                   # Modified: replace "Brain Dump" nav link with unified "Inbox" link + badge
```

**Structure Decision**: Existing monorepo structure (packages/db, packages/types, packages/core, packages/web). No new packages needed — all changes fit within existing package responsibilities.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
