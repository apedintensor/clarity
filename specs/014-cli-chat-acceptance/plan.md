# Implementation Plan: CLI Chat Acceptance & Inbox Workflow

**Branch**: `014-cli-chat-acceptance` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-cli-chat-acceptance/spec.md`

## Summary

Enable a complete CLI-only flow for inbox-linked brainstorming, multi-turn chat, and accepting AI-generated suggestions into goals/tasks/subtasks. The core changes are: (1) fix readline shutdown for piped input, (2) parse AI suggestion blocks and allow interactive acceptance, (3) add `inbox subtask` command, (4) add `--message`/`--stdin` flags for non-interactive chat, and (5) ensure short-ID resolution across all new commands.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode)
**Primary Dependencies**: Commander 13+, tRPC v11, Vercel AI SDK 4.1+ (@ai-sdk/google), Zod, chalk
**Storage**: SQLite (better-sqlite3) via Drizzle ORM
**Testing**: Playwright 1.58+ (E2E), vitest (unit — if added)
**Target Platform**: Node.js 20+ CLI (local machine)
**Project Type**: Monorepo (pnpm workspaces + Turborepo)
**Performance Goals**: <200ms p95 for non-AI calls, <30s for AI operations
**Constraints**: Single-user local-first, no auth, no remote API beyond Gemini
**Scale/Scope**: CLI package only + minor core utility (suggestion parser)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Monorepo Package Isolation | Changes only in `cli` and `core` packages | ✅ Pass | Chat/inbox CLI in `packages/cli`, suggestion parser utility in `packages/core` |
| II. Shared Core via tRPC | All business logic via tRPC procedures | ✅ Pass | Reuses existing `inbox.acceptSuggestion`, `inbox.convertToSubtask` router procedures |
| III. Type Safety First | Strict mode, Zod validation on inputs | ✅ Pass | All tRPC inputs already Zod-validated; CLI args validated by Commander |
| IV. Local-First Single User | No new network dependencies | ✅ Pass | Only existing Gemini API usage in chat |
| V. Spec-Driven Development | Spec → Plan → Tasks before implementation | ✅ Pass | This document |

## Project Structure

### Documentation (this feature)

```text
specs/014-cli-chat-acceptance/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── trpc-procedures.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── cli/src/
│   ├── commands/
│   │   ├── chat.ts          # MODIFY: readline fix, suggestion parsing, --message/--stdin flags
│   │   └── inbox.ts         # MODIFY: add "subtask" subcommand
│   ├── utils/
│   │   ├── prompts.ts       # MODIFY: handle piped input (EOF detection)
│   │   ├── output.ts        # existing (no changes)
│   │   └── resolve-id.ts    # existing (no changes)
│   └── index.ts             # existing (no changes — commands already registered)
├── core/src/
│   ├── ai/
│   │   ├── inbox-chat.ts    # existing (system prompt already defines suggestion format)
│   │   └── suggestion-parser.ts  # NEW: extract ---SUGGESTIONS--- blocks from AI text
│   └── router/
│       └── inbox.ts         # existing (acceptSuggestion + convertToSubtask already implemented)
└── types/src/               # no changes needed
```

**Structure Decision**: Existing monorepo structure. Two packages modified (`cli`, `core`), one new file added (`suggestion-parser.ts` in core). No new packages needed.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
