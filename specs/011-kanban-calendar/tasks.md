# Tasks: Kanban Calendar

**Input**: Design documents from `/specs/011-kanban-calendar/`
**Prerequisites**: spec.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 — Kanban Weekly Board View

- [X] T001 [US1] Replace FullCalendar with a kanban weekly board component showing day columns with task cards in packages/web/src/components/calendar-view.tsx

## Phase 2: US2+US3 — Drag-and-Drop & Task Card Actions

- [X] T002 [US2] Add drag-and-drop between day columns and to/from backlog, plus task card actions (click complete, double-click edit, right-click context menu) in packages/web/src/components/calendar-view.tsx

## Phase 3: US4 — Backlog Panel

- [X] T003 [US4] Update sidebar to show backlog with unscheduled tasks and drag-to-schedule support in packages/web/src/components/calendar-sidebar.tsx

## Phase 4: Integration

- [X] T004 Update calendar page layout for kanban board + backlog panel in packages/web/src/app/calendar/page.tsx

## Phase 5: Verification

- [X] T005 Verify full build passes with `pnpm -r run build`
