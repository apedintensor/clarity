# Tasks: AI Daily Planner (includes 008 fix-plan-page bug fix)

**Input**: Design documents from `/specs/008-fix-plan-page/` and `/specs/009-ai-daily-planner/`
**Prerequisites**: spec.md for both features
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 (008) — Fix Circular Update Loop

- [X] T001 [US1] Fix useEffect infinite loop by removing mutation from dependency array and calling mutate directly in toggleTask in packages/web/src/components/daily-planner.tsx

## Phase 2: US2 (008) — Plan Page UX Improvements

- [X] T002 [US2] Group tasks by goal with goal headings, add empty state, and improve page description in packages/web/src/components/daily-planner.tsx

## Phase 3: US1 (009) — AI Smart Pick

- [X] T003 [US1] Create AI smart-pick API route that analyzes tasks and returns prioritized selections in packages/web/src/app/api/smart-pick/route.ts
- [X] T004 [US1] Add "Smart Pick" button and AI recommendation UI with reasoning tags in packages/web/src/components/daily-planner.tsx

## Phase 4: US2 (009) — Auto-Schedule to Calendar

- [X] T005 [US2] Add "Schedule to Calendar" button that batch-schedules selected tasks to today's calendar in packages/web/src/components/daily-planner.tsx

## Phase 5: Verification

- [X] T006 Verify full build passes with `pnpm -r run build`
