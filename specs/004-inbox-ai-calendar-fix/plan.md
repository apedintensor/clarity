# Implementation Plan: Inbox AI Chat & Calendar Fixes

**Branch**: `004-inbox-ai-calendar-fix` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-inbox-ai-calendar-fix/spec.md`

## Summary

Two feature areas in one delivery: (1) Transform the inbox item detail modal into an AI-powered streaming chat that helps users brainstorm, challenge limiting beliefs, and generate structured goals/tasks from raw thoughts. (2) Fix the calendar page — show all tasks from all goals, add right-click context menus, implement goal-based color coding, and set Monday as the first day of the week.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), tRPC v11, Drizzle ORM, Vercel AI SDK 4.1+ (@ai-sdk/google), FullCalendar v6+ (dayGrid, timeGrid, interaction plugins), Sonner (toast), @atlaskit/pragmatic-drag-and-drop
**Storage**: SQLite via better-sqlite3 + Drizzle ORM
**Testing**: Manual quickstart scenarios (Playwright available but not required for this feature)
**Target Platform**: Local web app (localhost)
**Project Type**: Monorepo (pnpm workspaces + Turborepo)
**Performance Goals**: <200ms p95 for non-AI calls, <30s for AI operations, streaming chat tokens visible within 500ms of send
**Constraints**: Local-first single user, no auth, Gemini 2.0 Flash as AI provider
**Scale/Scope**: Single user, <100 goals, <1000 tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Monorepo Package Isolation | PASS | New AI chat logic in `packages/core/src/ai/`, new router in `packages/core/src/router/`, new UI in `packages/web/src/components/`, new schema in `packages/db/src/schema.ts`, new types in `packages/types/src/`. All within existing packages. |
| II. Shared Core via tRPC | PASS | All chat and calendar business logic exposed via tRPC procedures. Web consumes via tRPC client. No logic in surface packages. |
| III. Type Safety First | PASS | Zod validation on all new tRPC inputs. Drizzle schema as source of truth for new tables. Shared types in `packages/types/`. |
| IV. Local-First Single User | PASS | Conversation history stored in local SQLite. No new external services beyond existing Gemini API. |
| V. Spec-Driven Development | PASS | spec.md written and approved. Plan, research, data-model, contracts, and quickstart produced before implementation. |

## Project Structure

### Documentation (this feature)

```text
specs/004-inbox-ai-calendar-fix/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── types/src/
│   ├── conversation.ts          # NEW — Conversation, ConversationMessage types
│   ├── inbox.ts                 # MODIFY — add conversationId reference
│   ├── goal.ts                  # MODIFY — add colorIndex field
│   └── index.ts                 # MODIFY — re-export conversation types
│
├── db/src/
│   └── schema.ts                # MODIFY — add conversations, conversationMessages tables; add colorIndex to goals
│
├── core/src/
│   ├── ai/
│   │   └── inbox-chat.ts        # NEW — streaming AI chat logic for inbox brainstorming
│   └── router/
│       ├── conversation.ts      # NEW — conversation CRUD + AI chat streaming
│       ├── inbox.ts             # MODIFY — add convertToGoal, convertToTask, convertToSubtask
│       ├── task.ts              # MODIFY — fix getScheduled to return ALL scheduled tasks; add update procedure
│       └── goal.ts              # MODIFY — assign colorIndex on create
│
├── web/src/
│   ├── components/
│   │   ├── inbox-chat-modal.tsx          # NEW — AI chat modal replacing detail modal
│   │   ├── ai-suggestion-card.tsx        # NEW — displays goal/task suggestion from AI
│   │   ├── calendar-view.tsx             # MODIFY — add right-click menu, goal colors, Monday start
│   │   ├── calendar-event-menu.tsx       # NEW — context menu for calendar events
│   │   ├── calendar-task-edit-modal.tsx  # NEW — edit task from calendar
│   │   ├── calendar-sidebar.tsx          # MODIFY — add goal color indicators
│   │   └── inbox-item.tsx               # MODIFY — add Convert to Goal/Task/Subtask menu items
│   ├── lib/
│   │   └── goal-colors.ts               # NEW — color palette constant + helper
│   └── app/
│       ├── calendar/page.tsx             # MODIFY — fix date range calculation for Monday start
│       └── api/chat/route.ts             # NEW — Next.js API route for streaming AI responses
```

**Structure Decision**: Existing monorepo structure. All changes within existing packages. No new packages needed. The streaming AI chat requires a Next.js API route (`app/api/chat/route.ts`) because tRPC doesn't natively support streaming responses — the Vercel AI SDK `useChat` hook needs a standard HTTP streaming endpoint.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Next.js API route for streaming (bypasses tRPC) | Vercel AI SDK `useChat` requires a standard fetch-based streaming endpoint | tRPC doesn't support Server-Sent Events / streaming natively; wrapping would add complexity without benefit |
