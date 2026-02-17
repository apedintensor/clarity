# tRPC Procedure Contracts: CLI Chat Acceptance

**Feature**: 014-cli-chat-acceptance
**Date**: 2026-02-16

## Overview

No new tRPC procedures are required. All backend operations are already implemented. This document catalogs the existing procedures consumed by the new/modified CLI commands.

---

## Existing Procedures Used

### `inbox.acceptSuggestion` (mutation)

**Called by**: Chat command after user accepts a parsed suggestion

**Input**:
```typescript
{
  suggestion: {
    title: string         // min 1 char
    purpose: string       // min 1 char
    tasks: Array<{
      title: string       // min 1 char
      description?: string
      estimatedMinutes: number  // 5-120, default 30
    }>
  }
  inboxItemId?: string    // UUID, optional — soft-deletes item if provided
}
```

**Output**:
```typescript
{
  goalId: string          // UUID of created goal
  taskIds: string[]       // UUIDs of created tasks (in order)
}
```

**Side effects**:
- Creates brain dump anchor
- Creates goal with auto-assigned colorIndex
- Creates N tasks under the goal
- Soft-deletes inbox item if `inboxItemId` provided

---

### `inbox.convertToSubtask` (mutation)

**Called by**: `clarity inbox subtask <inboxId> --task <taskId>`

**Input**:
```typescript
{
  inboxItemId: string     // UUID
  taskId: string          // UUID — parent task
}
```

**Output**:
```typescript
{
  subtaskId: string       // UUID of created subtask
}
```

**Side effects**:
- Creates task with `parentTaskId` set to input `taskId`
- Inherits `goalId` from parent task
- Soft-deletes inbox item

**Errors**:
- `NOT_FOUND`: Inbox item not found
- `NOT_FOUND`: Parent task not found

---

### `conversation.getOrCreate` (mutation)

**Called by**: Chat command when linked to an inbox item

**Input**:
```typescript
{
  inboxItemId: string     // UUID
}
```

**Output**:
```typescript
{
  conversation: {
    id: string            // UUID
    inboxItemId: string
    createdAt: string
    updatedAt: string
  }
}
```

---

### `conversation.addMessage` (mutation)

**Called by**: Chat command after each user/assistant message

**Input**:
```typescript
{
  conversationId: string  // UUID
  role: "user" | "assistant"
  content: string
}
```

**Output**:
```typescript
{
  id: string              // UUID of created message
}
```

---

## New Utility Function (not a tRPC procedure)

### `parseSuggestions(text: string): Suggestion[] | null`

**Location**: `packages/core/src/ai/suggestion-parser.ts`

**Purpose**: Extract structured suggestion data from AI response text.

**Input**: Raw AI response text (string)

**Output**: Array of `Suggestion` objects, or `null` if no valid suggestion block found.

**Logic**:
1. Match regex: `/---SUGGESTIONS---\s*([\s\S]*?)\s*---END_SUGGESTIONS---/`
2. If no match, return `null`
3. `JSON.parse()` the captured group
4. Validate each element against the suggestion Zod schema
5. Return validated array, or `null` on parse/validation failure

**Zod Schema** (reuses acceptSuggestion input shape):
```typescript
const suggestionSchema = z.object({
  title: z.string().min(1),
  purpose: z.string().min(1),
  tasks: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    estimatedMinutes: z.number().min(5).max(120).default(30),
  })),
});
```

---

## CLI Command → Procedure Mapping

| CLI Command | tRPC Procedure(s) | New? |
|-------------|-------------------|------|
| `clarity chat <id> --message <text>` | `conversation.getOrCreate`, `conversation.addMessage`, `inbox.acceptSuggestion` | Modified |
| `clarity chat <id> --stdin` | Same as above | Modified |
| `clarity chat <id>` (interactive) | Same as above | Modified |
| `clarity inbox subtask <id> --task <taskId>` | `inbox.convertToSubtask` | New subcommand |
