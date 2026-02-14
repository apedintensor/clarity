# Implementation Plan: Braindump to Action

**Branch**: `001-braindump-to-action` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-braindump-to-action/spec.md`

## Summary

Clarity is a local-first productivity app that transforms unstructured
brain dumps into organized goals and actionable tasks using AI (Gemini).
It provides a web dashboard for visual interaction and a CLI for
terminal/AI-assistant usage. The app is grounded in procrastination
psychology (cognitive offloading, task decomposition, implementation
intentions) and Tony Robbins' RPM framework (Result, Purpose, Massive
Action Plan). Positive reinforcement through streaks, milestones, and
varied celebrations sustains motivation and enables flow states.

## Technical Context

**Language/Version**: TypeScript 5.6+ (strict mode)
**Primary Dependencies**: Next.js 15 (App Router), tRPC v11, Drizzle ORM, Vercel AI SDK, Commander
**Storage**: SQLite (via better-sqlite3 + Drizzle ORM)
**Testing**: Vitest (unit/integration), Playwright (e2e)
**Target Platform**: Local development machine (localhost)
**Project Type**: Web application (monorepo with CLI)
**Performance Goals**: <200ms p95 for non-AI API calls, <30s for AI operations
**Constraints**: Local-only, single user, Gemini API key required
**Scale/Scope**: Single user, ~10 active goals, ~100 active tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Single responsibility per module, descriptive naming, type safety enforced, linting configured | PASS — TypeScript strict mode + ESLint + Prettier configured in monorepo. Each package has a single responsibility. |
| II. Testing Standards | Unit tests for public functions, integration test per feature, 80% coverage floor, deterministic tests | PASS — Vitest for unit/integration, Playwright for e2e. Coverage threshold configured in vitest.config. |
| III. UX Consistency | Actionable error messages, consistent patterns, 200ms feedback, accessibility (WCAG 2.1 AA) | PASS — tRPC error handling provides consistent error format across web and CLI. Shared error messages from core package. |
| IV. Performance | <200ms p95 API, <1s first paint, no memory leaks, indexed queries | PASS — SQLite is local (no network latency), indexes defined in data model. Next.js RSC for fast first paint. |

No violations. Complexity Tracking section not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-braindump-to-action/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entity definitions
├── quickstart.md        # Phase 1 output — setup guide
├── contracts/
│   └── api.md           # Phase 1 output — tRPC procedure contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/
├── web/                    # Next.js 15 web dashboard
│   ├── src/
│   │   ├── app/            # App Router pages and layouts
│   │   │   ├── page.tsx                # Dashboard (goal overview)
│   │   │   ├── dump/
│   │   │   │   └── page.tsx            # Brain dump capture
│   │   │   ├── dump/[id]/
│   │   │   │   └── page.tsx            # Dump processing + clarification
│   │   │   ├── goal/[id]/
│   │   │   │   └── page.tsx            # Goal detail + task list
│   │   │   ├── focus/[goalId]/
│   │   │   │   └── page.tsx            # Focus mode (single task view)
│   │   │   └── api/
│   │   │       └── trpc/[trpc]/
│   │   │           └── route.ts        # tRPC HTTP handler
│   │   ├── components/
│   │   │   ├── brain-dump-input.tsx     # Large textarea capture
│   │   │   ├── clarification-chat.tsx  # Q&A clarification UI
│   │   │   ├── goal-card.tsx           # Goal with progress bar
│   │   │   ├── task-item.tsx           # Task row in list
│   │   │   ├── focus-view.tsx          # Single-task focus mode
│   │   │   ├── celebration.tsx         # Reinforcement animations
│   │   │   ├── streak-badge.tsx        # Streak counter display
│   │   │   ├── progress-bar.tsx        # Reusable progress indicator
│   │   │   └── timer.tsx               # Focus session timer
│   │   ├── lib/
│   │   │   └── trpc.ts                 # tRPC React client setup
│   │   └── styles/
│   │       └── globals.css             # Tailwind CSS + custom styles
│   └── tests/
│       ├── e2e/                        # Playwright tests
│       └── components/                 # Component unit tests
│
├── cli/                    # Node.js CLI tool
│   ├── src/
│   │   ├── index.ts                    # CLI entry point (Commander)
│   │   ├── commands/
│   │   │   ├── dump.ts                 # clarity dump <text>
│   │   │   ├── process.ts              # clarity process <id>
│   │   │   ├── goals.ts                # clarity goals
│   │   │   ├── breakdown.ts            # clarity breakdown <goalId>
│   │   │   ├── focus.ts                # clarity focus <goalId>
│   │   │   ├── done.ts                 # clarity done <taskId>
│   │   │   └── progress.ts             # clarity progress
│   │   └── utils/
│   │       ├── output.ts               # JSON/human-readable formatting
│   │       └── prompts.ts              # Interactive prompt helpers
│   └── tests/
│       └── commands/                   # CLI command tests
│
├── core/                   # Shared business logic
│   ├── src/
│   │   ├── router/
│   │   │   ├── index.ts                # Root tRPC router
│   │   │   ├── braindump.ts            # Brain dump procedures
│   │   │   ├── clarification.ts        # Clarification procedures
│   │   │   ├── goal.ts                 # Goal procedures
│   │   │   ├── task.ts                 # Task procedures
│   │   │   ├── progress.ts             # Progress procedures
│   │   │   └── reinforcement.ts        # Reinforcement message logic
│   │   ├── ai/
│   │   │   ├── prompts.ts              # AI prompt templates
│   │   │   ├── brain-dump-analyzer.ts  # Dump → themes/goals extraction
│   │   │   ├── clarifier.ts            # Clarification question generation
│   │   │   └── task-decomposer.ts      # Goal → task breakdown
│   │   ├── services/
│   │   │   ├── streak.ts               # Streak calculation logic
│   │   │   ├── milestone.ts            # Milestone detection
│   │   │   └── reinforcement.ts        # Message pool + selection
│   │   └── trpc.ts                     # tRPC context + initialization
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── db/                     # Database schema + access
│   ├── src/
│   │   ├── schema.ts                   # Drizzle schema definitions
│   │   ├── index.ts                    # Database connection
│   │   └── migrate.ts                  # Migration runner
│   ├── migrations/                     # SQL migration files
│   └── tests/
│
└── types/                  # Shared TypeScript types
    └── src/
        ├── index.ts                    # Re-exports
        ├── braindump.ts                # BrainDump types
        ├── goal.ts                     # Goal types
        ├── task.ts                     # Task types
        └── progress.ts                 # Progress types
```

**Structure Decision**: Web application structure (Option 2 adapted)
with a monorepo layout. The `packages/` directory contains five
packages: `web` (Next.js dashboard), `cli` (Commander CLI), `core`
(shared tRPC router and business logic), `db` (Drizzle schema and
SQLite connection), and `types` (shared TypeScript interfaces). This
enables maximum code sharing between web and CLI while maintaining
clear separation of concerns.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.
