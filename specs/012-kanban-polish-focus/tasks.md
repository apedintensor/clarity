# Tasks: Kanban Polish & Focus Mode

**Input**: Design documents from `/specs/012-kanban-polish-focus/`
**Prerequisites**: spec.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 — Full-Width Layout

- [X] T001 [US1] Make calendar page full-width and expand all kanban columns equally in packages/web/src/app/calendar/page.tsx

## Phase 2: US2 — Task Card Redesign

- [X] T002 [US2] Redesign task cards: move checkbox to bottom row, add Start button, improve colors and readability in packages/web/src/components/calendar-view.tsx

## Phase 3: US3 — Focus Mode

- [X] T003 [US3] Add focus mode overlay with timer, STOP button, and completion checkbox in packages/web/src/components/calendar-view.tsx

## Phase 4: Verification

- [X] T004 Verify full build passes with `pnpm -r run build`
