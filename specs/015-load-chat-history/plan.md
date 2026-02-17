# Implementation Plan: Load Conversation History in Message Mode

**Branch**: `015-load-chat-history` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-load-chat-history/spec.md`

## Summary

Enable `--message` mode in the CLI chat command to load and use persisted conversation history from the database before sending to the AI. Currently, the `conversation.getOrCreate` tRPC procedure already retrieves messages from the database, but the chat command's `handleSingleExchange` function doesn't use them. The solution involves populating the `chatHistory` array with loaded messages before calling the AI, ensuring multi-turn conversations maintain context across invocations.

**Key Insight**: The database infrastructure and tRPC procedures for loading conversation messages already exist. The implementation is primarily a matter of using the existing `messages` array returned by `conversation.getOrCreate` to populate the `chatHistory` before sending to the AI.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode)
**Primary Dependencies**: Commander 13+, tRPC v11, Vercel AI SDK 4.1+ (@ai-sdk/google), Drizzle ORM 0.38+, better-sqlite3, Zod
**Storage**: SQLite (via better-sqlite3 + Drizzle ORM) at project root (`clarity.db`)
**Testing**: Playwright 1.58+ (E2E), manual CLI testing
**Target Platform**: Node.js 20+ (CLI application)
**Project Type**: Monorepo (pnpm workspaces + Turborepo) - CLI package consuming core via tRPC
**Performance Goals**: <200ms p95 for database query (loading conversation messages), <30s for AI operations (per constitution)
**Constraints**:
- Token limit management: AI model has maxTokens: 1500 (current setting in chat.ts:239)
- Must handle conversations that exceed token limits by truncating oldest messages
- Must maintain message order (chronological: oldest to newest)
**Scale/Scope**: Expected conversation sizes: 1-100 messages per conversation, with most under 20 messages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Before Phase 0)

| Principle | Compliance Status | Notes |
|-----------|-------------------|-------|
| **I. Monorepo Package Isolation** | ✅ PASS | Changes isolated to `packages/cli/src/commands/chat.ts`. Consumes existing tRPC procedures from `packages/core/src/router/conversation.ts`. No new packages needed. Downward dependency flow maintained: cli → core → db → types. |
| **II. Shared Core via tRPC** | ✅ PASS | Uses existing `conversation.getOrCreate` tRPC procedure which already returns messages from database. No new tRPC procedures needed. Business logic remains in core; CLI only handles presentation and AI SDK integration. |
| **III. Type Safety First** | ✅ PASS | TypeScript strict mode enforced. Existing Zod schemas in `conversation.ts` validate inputs. Drizzle schema types are source of truth for `conversationMessages` shape. No type safety violations. |
| **IV. Local-First Single User** | ✅ PASS | Uses existing SQLite database at project root. No network services beyond Gemini AI. No authentication or multi-tenancy concerns. Performance target: message loading < 200ms for 50 messages (well within p95 goal). |
| **V. Spec-Driven Development** | ✅ PASS | Following prescribed workflow: spec.md → plan.md → tasks.md before implementation. All required artifacts present in `specs/015-load-chat-history/`. |

**Initial Gate Result**: ✅ ALL GATES PASS - Proceeded to Phase 0

### Re-Check (After Phase 1 Design)

| Principle | Compliance Status | Notes |
|-----------|-------------------|-------|
| **I. Monorepo Package Isolation** | ✅ PASS | Design confirms: single-file modification (`chat.ts`). No cross-package changes. Helper function `truncateHistoryToTokenLimit()` added within CLI package. Maintains clean separation. |
| **II. Shared Core via tRPC** | ✅ PASS | Design confirms: zero new tRPC procedures. Documented in `contracts/trpc-procedures.md`. All data access via existing `conversation.getOrCreate` and `conversation.addMessage`. |
| **III. Type Safety First** | ✅ PASS | Design confirms: chatHistory array uses existing type `Array<{ role: "user" | "assistant"; content: string }>`. No type safety compromises. Token truncation logic preserves type safety. |
| **IV. Local-First Single User** | ✅ PASS | Design confirms: performance analysis in `data-model.md` shows 5-20ms for 50 messages (well under 200ms target). No new network dependencies. Graceful error handling for database failures. |
| **V. Spec-Driven Development** | ✅ PASS | Design confirms: all Phase 1 artifacts complete (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`). Agent context updated. Ready for Phase 2 (tasks). |

**Post-Design Gate Result**: ✅ ALL GATES PASS - Ready for Phase 2 (/speckit.tasks)

## Project Structure

### Documentation (this feature)

```text
specs/015-load-chat-history/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── trpc-procedures.md  # Document existing procedures used
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── cli/
│   └── src/
│       └── commands/
│           └── chat.ts                    # PRIMARY: Modify handleSingleExchange to load history
├── core/
│   └── src/
│       └── router/
│           └── conversation.ts            # REFERENCE: Existing getOrCreate procedure (no changes needed)
├── db/
│   └── src/
│       └── schema.ts                      # REFERENCE: conversationMessages schema (no changes needed)
└── types/
    └── src/
        └── conversation.ts                # REFERENCE: Existing types (no changes needed)

tests/
└── cli/                                   # NEW: Manual CLI test scripts for validation
    └── chat-history.test.sh               # Test script for sequential --message commands
```

**Structure Decision**: Single package modification (cli). The feature modifies only `packages/cli/src/commands/chat.ts` to use the `messages` array already returned by the existing `conversation.getOrCreate` tRPC procedure. No changes to core, db, or types packages required. The existing database schema, tRPC procedures, and type definitions already support this feature.

## Complexity Tracking

> **Not applicable** - No constitution violations. All gates pass without justification needed.
