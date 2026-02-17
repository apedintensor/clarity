# Tasks: Calendar & AI Chat Polish

**Input**: Design documents from `/specs/007-calendar-chat-polish/`
**Prerequisites**: spec.md
**Tests**: Not explicitly requested — test tasks omitted.

---

## Phase 1: US1 — Individual Goal Suggestion Accept/Reject

- [X] T001 [US1] Remove inboxItemId from acceptSuggestion call so inbox item stays active in packages/web/src/components/inbox-chat-modal.tsx
- [X] T002 [US1] Track accepted suggestions in state and hide Accept/Reject buttons for already-accepted suggestions in packages/web/src/components/inbox-chat-modal.tsx

## Phase 2: US2 — Editable Tasks in Modify Mode

- [X] T003 [US2] Add editable task list (title, description, duration, add/remove) in modify mode in packages/web/src/components/ai-suggestion-card.tsx

## Phase 3: US3 — Double-Click Calendar Event to Edit

- [X] T004 [US3] Replace single-click "Mark as done?" with double-click to open edit modal in packages/web/src/components/calendar-view.tsx
- [X] T005 [US3] Improve CalendarTaskEditModal to load task description from cache and add status field in packages/web/src/components/calendar-task-edit-modal.tsx

## Phase 4: US4 — Expandable Chat Input Box

- [X] T006 [US4] Replace input element with auto-expanding textarea (max ~6 lines) in packages/web/src/components/inbox-chat-modal.tsx

## Phase 5: US5 — AI Web Search via Gemini

- [X] T007 [US5] Add Google Search grounding tool to Gemini API call in packages/web/src/app/api/chat/route.ts

## Phase 6: US6 — Calendar Zoom with Ctrl+Scroll

- [X] T008 [US6] Add Ctrl+scroll zoom handler to adjust calendar slot height in packages/web/src/components/calendar-view.tsx

## Phase 7: US7 — Optimized Calendar Drag Performance

- [X] T009 [US7] Add drag performance optimizations (eventDragMinDistance, CSS will-change, snapDuration) in packages/web/src/components/calendar-view.tsx

## Phase 8: Verification

- [X] T010 Verify full build passes with `pnpm -r run build`
