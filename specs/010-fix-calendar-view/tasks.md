# Tasks: Fix Calendar View

**Input**: Design documents from `/specs/010-fix-calendar-view/`
**Prerequisites**: spec.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 — Prepopulate Edit Task Modal

- [X] T001 [US1] Fix edit task modal to prepopulate all fields from the selected task's data in packages/web/src/components/calendar-task-edit-modal.tsx and packages/web/src/components/calendar-view.tsx

## Phase 2: US2 — Resizable Calendar Columns

- [X] T002 [US2] Change scroll zoom to work without modifier keys and increase default slot height for readability in packages/web/src/components/calendar-view.tsx

## Phase 3: US3 — Auto-Reschedule Unfinished Tasks

- [X] T003 [US3] Add auto-reschedule logic that pushes incomplete past tasks forward to current time on calendar load in packages/web/src/components/calendar-view.tsx

## Phase 4: US4 — Sunsama-Inspired Task List Panel

- [X] T004 [US4] Add a task list sidebar panel to the calendar page showing today's tasks with drag-to-schedule support in packages/web/src/app/calendar/page.tsx and packages/web/src/components/calendar-view.tsx

## Phase 5: Verification

- [X] T005 Verify full build passes with `pnpm -r run build`
