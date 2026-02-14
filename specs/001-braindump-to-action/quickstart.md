# Quickstart: Clarity — Braindump to Action

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 9+ (`npm install -g pnpm`)
- A Google Gemini API key ([Get one free](https://aistudio.google.com/apikey))

## Setup

```bash
# Clone and install
git clone <repo-url> clarity
cd clarity
pnpm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Initialize the database
pnpm db:push

# Start the web dashboard
pnpm dev
```

Open http://localhost:3000 in your browser.

## CLI Setup

```bash
# Link the CLI globally (from repo root)
pnpm cli:link

# Verify installation
clarity --help
```

## Your First Brain Dump (Web)

1. Open http://localhost:3000
2. Click the brain dump input area
3. Type everything on your mind about a goal or project — don't
   worry about structure, grammar, or order
4. Click "Capture" (or just wait — auto-saves)
5. Click "Process with AI" to organize your thoughts
6. Answer the clarification questions (up to 5)
7. Review your organized goals and purpose statements
8. Click "Break Down" on a goal to generate tasks
9. Click "Focus" to enter distraction-free task mode
10. Complete tasks one by one — celebrate each win!

## Your First Brain Dump (CLI)

```bash
# Capture a brain dump
clarity dump "I want to launch my side project but I keep
procrastinating. I need to finish the landing page, set up
payments, write the docs, and tell people about it. I'm
scared nobody will care."

# Process with AI (interactive clarification)
clarity process <dump-id>

# View your organized goals
clarity goals

# Break a goal into tasks
clarity breakdown <goal-id>

# Enter focus mode
clarity focus <goal-id>

# Check your progress
clarity progress
```

## Your First Brain Dump (CLI + Pipe)

```bash
# Pipe from a file
cat my-thoughts.txt | clarity dump -

# Pipe from another command
echo "I need to reorganize my entire filing system" | clarity dump -
```

## Key Concepts

- **Brain Dump**: Raw, unstructured thoughts. No filtering needed.
- **Goal**: A specific outcome with a purpose ("why it matters").
- **Task**: A 25-90 minute actionable step with a clear "done"
  definition.
- **Focus Mode**: Single-task view. Complete one, get the next
  automatically.
- **Streak**: Consecutive days with at least one task completed.

## Project Structure

```text
clarity/
├── packages/
│   ├── web/           # Next.js web dashboard
│   ├── cli/           # Node.js CLI tool
│   ├── core/          # Shared business logic + AI prompts
│   ├── db/            # Drizzle schema + SQLite database
│   └── types/         # Shared TypeScript types
├── pnpm-workspace.yaml
├── turbo.json
└── .env
```

## Common Commands

```bash
# Development
pnpm dev              # Start web dashboard (localhost:3000)
pnpm cli:dev          # Run CLI in dev mode

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:e2e         # End-to-end tests

# Database
pnpm db:push          # Apply schema changes
pnpm db:studio        # Open Drizzle Studio (database browser)

# Build
pnpm build            # Build all packages
pnpm cli:build        # Build CLI only
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| GEMINI_API_KEY | Yes | Google Gemini API key for AI features |
| DATABASE_URL | No | SQLite path (default: ./clarity.db) |
| PORT | No | Web server port (default: 3000) |
