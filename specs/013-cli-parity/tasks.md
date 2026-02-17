# Tasks: CLI Parity

**Input**: Design documents from `/specs/013-cli-parity/`
**Prerequisites**: spec.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 — Inbox Commands

- [X] T001 [US1] Add inbox CLI commands (list, add, convert, assign, delete) in packages/cli/src/commands/inbox.ts

## Phase 2: US2 — Schedule & Calendar Commands

- [X] T002 [US2] Add schedule, unschedule, and calendar CLI commands in packages/cli/src/commands/schedule.ts

## Phase 3: US3 — Daily Plan Command

- [X] T003 [US3] Add interactive daily plan CLI command in packages/cli/src/commands/plan.ts

## Phase 4: Registration

- [X] T004 Register all new commands in packages/cli/src/index.ts

## Phase 5: Verification

- [X] T005 Verify full build passes with `pnpm -r run build`
