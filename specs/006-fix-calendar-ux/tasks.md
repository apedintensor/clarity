# Tasks: Fix Calendar UX

**Input**: Design documents from `/specs/006-fix-calendar-ux/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 — Fix Missing Unscheduled Tasks in Sidebar

- [X] T001 [US1] Debug and fix the sidebar task filter to ensure all active, non-deleted, non-completed, unscheduled tasks appear in packages/web/src/components/calendar-sidebar.tsx

## Phase 2: US2 — Today as First Column

- [X] T002 [US2] Change FullCalendar `firstDay` from static Monday (1) to dynamic today's day-of-week in packages/web/src/components/calendar-view.tsx
- [X] T003 [US2] Update date range calculation in calendar/page.tsx to start from today instead of Monday in packages/web/src/app/calendar/page.tsx

## Phase 3: US4 — Context Menu Fix (before US3 since both touch calendar-view.tsx)

- [X] T004 [US4] Replace "Delete" with "Remove from Calendar" in context menu, using task.unschedule instead of task.softDelete in packages/web/src/components/calendar-view.tsx

## Phase 4: US3 — Drag to Unschedule

- [X] T005 [US3] Add `eventDragStop` handler to detect drops on sidebar and call task.unschedule in packages/web/src/components/calendar-view.tsx
- [X] T006 [US3] Add drop zone visual indicator on sidebar when dragging events in packages/web/src/components/calendar-sidebar.tsx

## Phase 5: US5 — Dark Mode Calendar

- [X] T007 [US5] Add FullCalendar dark mode CSS overrides for headers, grid, time labels, and borders in packages/web/src/styles/globals.css

## Phase 6: Verification

- [X] T008 Verify full build passes with `pnpm -r run build`
- [ ] T009 Run quickstart.md scenarios 1–14 and verify all pass
