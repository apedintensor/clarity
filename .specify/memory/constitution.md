<!--
Sync Impact Report
  Version change: 0.0.0 → 1.0.0 (initial ratification)
  Added principles:
    - I. Monorepo Package Isolation
    - II. Shared Core via tRPC
    - III. Type Safety First
    - IV. Local-First Single User
    - V. Spec-Driven Development
  Added sections:
    - Technology Stack
    - Development Workflow
    - Governance
  Removed sections: (none — initial version)
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ Constitution Check table
      already uses generic principle/gate structure; no update needed.
    - .specify/templates/spec-template.md — ✅ No constitution-specific
      references; no update needed.
    - .specify/templates/tasks-template.md — ✅ Phase/checkpoint structure
      is generic; no update needed.
  Follow-up TODOs: none
-->

# Clarity Constitution

## Core Principles

### I. Monorepo Package Isolation

Every capability lives in a dedicated package under `packages/`.
Each package MUST have a single responsibility:

- **types** — shared TypeScript interfaces and type definitions only
- **db** — Drizzle ORM schema, connection, and migrations only
- **core** — tRPC router and business logic (AI services, domain
  services) only
- **cli** — Commander-based CLI consuming core via tRPC only
- **web** — Next.js 15 App Router dashboard consuming core via tRPC only

New functionality MUST be placed in the package whose responsibility
matches. If no existing package fits, a new package MAY be created
but MUST be justified in the plan's Complexity Tracking table.
Cross-package imports MUST flow downward: `web`/`cli` → `core` →
`db` → `types`. Circular dependencies are forbidden.

### II. Shared Core via tRPC

All business logic MUST be exposed through tRPC procedures defined
in `packages/core/src/router/`. Both `web` and `cli` MUST consume
the same tRPC router — no duplicating logic in surface packages.

- Router files map 1:1 to domain concepts (braindump, goal, task,
  clarification, progress, reinforcement).
- AI operations (Vercel AI SDK + Gemini) live in
  `packages/core/src/ai/` and are called by router procedures.
- Domain services live in `packages/core/src/services/` for logic
  that spans multiple router concerns (streaks, milestones,
  reinforcement).

### III. Type Safety First

TypeScript strict mode (`"strict": true`) is non-negotiable across
all packages. The shared `tsconfig.base.json` MUST enforce:

- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

Zod schemas MUST validate all tRPC procedure inputs. Drizzle schema
types MUST be the single source of truth for database shapes.
Shared domain types live in `packages/types/` and MUST be imported
by any package that references those shapes.

### IV. Local-First Single User

Clarity runs entirely on the developer's local machine. SQLite is
the sole data store. There is no authentication, no multi-tenancy,
and no remote API beyond the Gemini AI provider.

- Database files (`clarity.db*`) live at the project root and inside
  `packages/cli/`.
- No network services are required beyond `localhost` and the
  Gemini API.
- Performance target: <200 ms p95 for non-AI API calls, <30 s for
  AI operations.

### V. Spec-Driven Development

Every feature MUST begin with a specification in
`specs/[###-feature-name]/` before implementation starts. The
minimum artifact set is:

1. `spec.md` — user stories with priorities, acceptance scenarios,
   functional requirements, success criteria
2. `plan.md` — technical context, constitution check, project
   structure, complexity tracking
3. `tasks.md` — phased, dependency-ordered task list grouped by
   user story

Additional artifacts (research.md, data-model.md, contracts/,
quickstart.md, checklists/) are produced as needed. Implementation
MUST NOT begin until spec and plan are approved.

## Technology Stack

The following versions and tools are locked for v1. Changes require
a constitution amendment (MAJOR version bump).

| Layer | Technology | Version Floor |
|-------|-----------|---------------|
| Language | TypeScript | 5.6+ (strict) |
| Runtime | Node.js | 20+ |
| Web framework | Next.js (App Router) | 15 |
| API layer | tRPC | 11 |
| ORM | Drizzle ORM | 0.38+ |
| Database | SQLite (better-sqlite3) | — |
| AI SDK | Vercel AI SDK + @ai-sdk/google | 4.1+ / 1.1+ |
| CLI framework | Commander | 13+ |
| Styling | Tailwind CSS | 4+ |
| Monorepo | pnpm workspaces + Turborepo | pnpm 9 / turbo 2 |
| Linting | ESLint 9 + Prettier 3 | — |
| E2E testing | Playwright | 1.58+ |

## Development Workflow

1. **Branch per feature**: branch name matches
   `[###-feature-name]` (e.g., `001-braindump-to-action`).
2. **Spec first**: run `/speckit.specify` → `/speckit.plan` →
   `/speckit.tasks` before writing code.
3. **Build & lint before commit**: `npm test && npm run lint`
   MUST pass.
4. **Turbo pipeline**: `turbo build` resolves inter-package
   dependencies; `turbo dev` for local development.
5. **Database changes**: modify `packages/db/src/schema.ts`, then
   run `pnpm db:push` to apply.

## Governance

This constitution supersedes all other development practices for
the Clarity project. Amendments require:

1. A documented rationale in the commit message.
2. A version bump following semantic versioning:
   - **MAJOR**: principle removed or redefined, technology stack
     changed
   - **MINOR**: new principle or section added, materially expanded
     guidance
   - **PATCH**: clarifications, wording, non-semantic refinements
3. An updated Sync Impact Report (HTML comment at top of this file).
4. Verification that all templates in `.specify/templates/` remain
   consistent with updated principles.

All feature plans MUST include a Constitution Check table verifying
compliance with each Core Principle before implementation begins.

**Version**: 1.0.0 | **Ratified**: 2026-02-14 | **Last Amended**: 2026-02-14
