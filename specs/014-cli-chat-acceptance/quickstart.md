# Quickstart: CLI Chat Acceptance & Inbox Workflow

**Feature**: 014-cli-chat-acceptance
**Date**: 2026-02-16

## Prerequisites

- Node.js 20+
- pnpm 9+
- `GOOGLE_GENERATIVE_AI_API_KEY` set in `.env`

## Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm turbo build

# Ensure database exists
pnpm db:push
```

## Key Workflows

### 1. Interactive Chat with Suggestion Acceptance

```bash
# Add an inbox item
clarity inbox add "I want to learn Spanish for my trip to Barcelona"

# Start a chat session linked to the inbox item
clarity chat <inboxId>

# In the chat, brainstorm with the AI, then ask:
#   "Can you suggest goals and tasks for this?"
# The AI generates structured suggestions
# You'll be prompted: "Accept suggestion 1? (y/n)"
# Accepting creates the goal + tasks automatically
```

### 2. Non-Interactive Chat (Scripted)

```bash
# Single message mode
clarity chat <inboxId> --message "Suggest goals for this idea" --json

# Piped input mode
echo "What tasks would help me achieve this?" | clarity chat <inboxId> --stdin --json
```

### 3. Subtask Conversion

```bash
# Convert an inbox item to a subtask under an existing task
clarity inbox subtask <inboxId> --task <taskId>

# With JSON output
clarity inbox subtask <inboxId> --task <taskId> --json
```

### 4. End-to-End Flow

```bash
# 1. Capture idea
clarity inbox add "Get healthier this year"

# 2. Brainstorm with AI
clarity chat <inboxId> --message "Help me break this down into goals"

# 3. Accept suggestion (creates goal + tasks)
# (done interactively in chat, or via JSON output parsing)

# 4. Schedule a task
clarity schedule <taskId> --date 2026-02-17

# 5. Mark as done
clarity done <taskId>
```

## Files to Modify

| File | Change |
|------|--------|
| `packages/cli/src/commands/chat.ts` | Readline fix, suggestion parsing, --message/--stdin flags |
| `packages/cli/src/commands/inbox.ts` | Add `subtask` subcommand |
| `packages/cli/src/utils/prompts.ts` | EOF-safe `ask()` for piped input |
| `packages/core/src/ai/suggestion-parser.ts` | NEW — parse suggestion blocks from AI text |

## Testing

```bash
# Interactive chat
clarity chat <inboxId>

# Piped chat (should exit cleanly, no readline errors)
echo "test" | clarity chat <inboxId>

# Non-interactive with JSON
clarity chat <inboxId> --message "suggest goals" --json

# Subtask conversion
clarity inbox subtask <inboxId> --task <taskId> --json
```
