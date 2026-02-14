# Research: Braindump to Action

**Branch**: `001-braindump-to-action` | **Date**: 2026-02-14

## Technology Decisions

### Full-Stack Framework: Next.js 15 + tRPC v11

**Decision**: Next.js 15 (App Router) with tRPC for end-to-end type-safe API layer.

**Rationale**:
- End-to-end TypeScript type safety between web UI, API, and CLI
- tRPC eliminates REST boilerplate — calling APIs feels like local functions
- App Router provides React Server Components for fast initial loads
- Largest ecosystem and community support of any React meta-framework
- Vercel AI SDK integrates natively for streaming AI responses

**Alternatives considered**:
- SvelteKit: Better bundle size and DX scores, but smaller ecosystem and harder to share code with a Node.js CLI
- FastAPI + React: Excellent AI/ML ecosystem in Python, but two languages means zero code sharing and double maintenance
- Remix: Strong web standards approach, but smaller ecosystem than Next.js and less AI tooling

### Database: SQLite (via Drizzle ORM)

**Decision**: SQLite as the sole database, accessed through Drizzle ORM.

**Rationale**:
- Local-only app — no need for a database server
- Single file database — zero configuration, zero deployment
- CLI and web dashboard share the same database file directly
- Eliminates real-time sync complexity entirely (both interfaces read/write same file)
- Drizzle ORM provides type-safe queries with minimal overhead
- Better-sqlite3 driver for synchronous, fast access from Node.js
- Sufficient for single-user workloads (handles millions of rows)

**Alternatives considered**:
- PostgreSQL: Production-grade but requires running a server process, overkill for local-only single-user
- PostgreSQL + SQLite sync (PowerSync): Useful for cloud deployment, unnecessary complexity for local-only
- MongoDB: Flexible schema but requires server, weaker transactions, no benefit over SQLite for structured task data

### CLI Tool: Node.js + Commander

**Decision**: Node.js CLI using Commander for argument parsing, sharing the TypeScript monorepo with the web app.

**Rationale**:
- 100% code sharing with web app — same types, validation, business logic, database access
- Single language (TypeScript) across entire project
- Commander is the most popular Node.js CLI framework
- tRPC client can optionally call the API, or CLI can access SQLite directly
- Chalk for colored output, Inquirer for interactive prompts
- Install via npx or global npm install

**Alternatives considered**:
- Go + Cobra: Faster startup (<50ms vs ~300ms), single binary, but zero code sharing with TypeScript web app
- Rust + Clap: Best performance, but steep learning curve and no code sharing
- Python + Typer: Good DX, but no code sharing with TypeScript web app

### AI Integration: Vercel AI SDK + Google Gemini

**Decision**: Vercel AI SDK with the Google Generative AI provider (@ai-sdk/google).

**Rationale**:
- Native streaming support with React hooks (useChat, useCompletion)
- Supports Gemini out of the box via @ai-sdk/google provider
- Reduces streaming UI implementation from 100+ lines to ~20 lines
- Type-safe tool calling and structured output generation
- Works in both browser (via API route) and Node.js (CLI)
- Provider-agnostic — can switch to OpenAI/Anthropic later without code changes
- Most downloaded TypeScript AI framework

**Alternatives considered**:
- Direct Gemini API calls: Maximum control, but manual streaming, no React hooks, more boilerplate
- LangChain: Powerful for complex agent workflows, but 101KB gzipped, overkill for task decomposition
- LlamaIndex: Better for RAG pipelines, not needed for this use case

### Real-Time Sync: Shared SQLite (No Sync Needed)

**Decision**: CLI and web dashboard both access the same SQLite database file. No real-time sync mechanism required.

**Rationale**:
- Both interfaces run locally on the same machine
- SQLite supports concurrent readers with WAL mode
- Web dashboard can poll or use file watchers for live updates
- Eliminates WebSocket/SSE/polling complexity entirely

**Alternatives considered**:
- SSE via tRPC subscriptions: Useful for client-server architecture, unnecessary when sharing a database file
- WebSockets: Bidirectional streaming, but complex infrastructure for no benefit in local-only setup
- Polling: Simple but wasteful — file watching is more efficient for local changes

### Build System: pnpm Workspaces + Turborepo

**Decision**: pnpm workspaces for monorepo package management, Turborepo for build orchestration.

**Rationale**:
- pnpm is fastest package manager with efficient disk usage (symlinks, content-addressable store)
- Turborepo provides build caching and parallel task execution
- Clean separation of packages: web, cli, core (shared logic), db (schema)
- Single `pnpm install` sets up entire project

**Alternatives considered**:
- npm workspaces: Simpler but slower installs, no content-addressable store
- Yarn Berry: Good but pnpm has better monorepo DX in 2026
- Nx: More powerful but more complex, overkill for 4-package monorepo

### Testing: Vitest + Playwright

**Decision**: Vitest for unit/integration tests, Playwright for end-to-end tests.

**Rationale**:
- Vitest is TypeScript-native, fastest test runner, compatible with Jest API
- Shares Vite config with Next.js development server
- Playwright tests both web dashboard and can validate CLI output
- Both tools have excellent TypeScript support

**Alternatives considered**:
- Jest: Industry standard but slower than Vitest, requires more configuration for TypeScript
- Cypress: Good for e2e but slower than Playwright, no multi-browser support

## Psychology-Informed Design Decisions

### Brain Dump Capture

- **Cognitive offloading research**: Externalizing thoughts frees working memory. The capture interface MUST be frictionless — no formatting, no categorization, just a large text area.
- **GTD mind sweep**: David Allen's capture phase emphasizes speed over organization. The UI should encourage dumping everything without filtering.
- **Implementation**: Large textarea with auto-save, no submit button required. Countdown timer option for focused 5-10 minute dump sessions.

### AI Clarification Flow

- **Tony Robbins RPM**: Three questions — What result? Why? How? The AI MUST extract purpose (emotional "why") from the dump, not just tasks.
- **Implementation intentions**: "If-then" planning bridges the intention-action gap. The AI should generate implementation intentions alongside tasks.
- **Limit**: Maximum 5 clarification questions per dump to prevent analysis paralysis.

### Task Decomposition

- **Task decomposition research**: Breaking goals into subgoals shows large effect sizes (Cohen's d = 1.09) in reducing procrastination.
- **Chunking**: Tony Robbins' chunking principle — group related tasks, present manageable sets.
- **Time-boxing**: Tasks sized for 25-90 minute Pomodoro-style sessions. The Zeigarnik effect keeps people engaged once started.

### Focus Mode

- **Flow state conditions (Csikszentmihalyi)**: Clear goals, immediate feedback, challenge-skill balance.
- **Context switching cost**: 5-second interruptions triple error rates. Focus mode MUST eliminate ALL distractions.
- **Single-task presentation**: Show only the current task. Auto-advance on completion eliminates decision fatigue.

### Positive Reinforcement

- **Variable reward schedules**: More effective than fixed rewards. Vary celebration messages and surprise bonuses.
- **Goal-gradient effect**: People try harder as they approach completion. Progress bars MUST be visible.
- **Endowed progress effect**: Start progress bars slightly filled to reduce abandonment.
- **Streak mechanics**: Leverage loss aversion — people feel losses 2x more than equivalent gains.
- **Immediate rewards**: Celebration MUST appear within 1 second of task completion. Delays break the dopamine association.
