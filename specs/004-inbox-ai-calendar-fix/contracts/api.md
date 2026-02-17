# API Contracts: Inbox AI Chat & Calendar Fixes

**Feature**: 004-inbox-ai-calendar-fix
**Date**: 2026-02-14

## New Router: `conversation`

### conversation.getOrCreate

Get existing conversation for an inbox item, or create a new one.

**Input**:
```typescript
{
  inboxItemId: string; // required
}
```

**Output**:
```typescript
{
  conversation: Conversation;
  messages: ConversationMessage[];
}
```

**Behavior**: If a conversation already exists for the inbox item, return it with all messages. Otherwise, create a new conversation and return it with an empty message array.

---

### conversation.addMessage

Save a user message to the conversation history.

**Input**:
```typescript
{
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}
```

**Output**:
```typescript
{
  message: ConversationMessage;
}
```

**Behavior**: Inserts the message and updates the conversation's `updatedAt` timestamp.

---

### conversation.saveAssistantMessage

Save the complete assistant response after streaming finishes.

**Input**:
```typescript
{
  conversationId: string;
  content: string;
}
```

**Output**:
```typescript
{
  message: ConversationMessage;
}
```

**Behavior**: Saves the full streamed assistant response to the database for history persistence.

---

## Streaming Endpoint: `POST /api/chat`

**Not a tRPC procedure** — this is a Next.js API route for streaming.

**Input** (JSON body):
```typescript
{
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  inboxItemText: string; // original inbox item text for context
  conversationId: string; // for saving the response after streaming
}
```

**Output**: Server-Sent Events stream (text/event-stream) compatible with Vercel AI SDK `useChat`.

**Behavior**:
1. Prepends system prompt with the inbox item text as context
2. Calls `streamText()` with Gemini 2.0 Flash
3. Streams response tokens to the client
4. The client saves the completed message via `conversation.saveAssistantMessage`

**System Prompt Responsibilities**:
- Act as a personal growth coach and brainstorming partner
- Ask clarifying questions to help the user think deeper
- Expand on ideas and suggest possibilities
- Challenge limiting beliefs with empathy
- Be realistic while encouraging
- When asked, generate structured goal suggestions in a parseable format

---

## Modified Router: `inbox`

### inbox.convertToGoal

Convert an inbox item directly into a goal.

**Input**:
```typescript
{
  inboxItemId: string;
}
```

**Output**:
```typescript
{
  goalId: string;
}
```

**Behavior**: Creates a new goal with the inbox item's title as the goal title. Assigns the next available `colorIndex`. Soft-deletes the inbox item.

---

### inbox.convertToTask

Convert an inbox item into a task under an existing goal.

**Input**:
```typescript
{
  inboxItemId: string;
  goalId: string;
}
```

**Output**:
```typescript
{
  taskId: string;
}
```

**Behavior**: Creates a new task under the specified goal with the inbox item's title. Soft-deletes the inbox item.

---

### inbox.convertToSubtask

Convert an inbox item into a subtask under an existing task.

**Input**:
```typescript
{
  inboxItemId: string;
  taskId: string;
}
```

**Output**:
```typescript
{
  subtaskId: string;
}
```

**Behavior**: Creates a new task with `parentTaskId` set to the specified task. Inherits the parent task's `goalId`. Soft-deletes the inbox item.

---

## Modified Router: `inbox`

### inbox.acceptSuggestion

Create a goal with tasks from an AI suggestion.

**Input**:
```typescript
{
  suggestion: {
    title: string;
    purpose: string;
    tasks: Array<{
      title: string;
      description?: string;
      estimatedMinutes?: number;
    }>;
  };
  inboxItemId: string; // optional: soft-delete the inbox item after accepting
}
```

**Output**:
```typescript
{
  goalId: string;
  taskIds: string[];
}
```

**Behavior**: Creates a new goal with the suggested title and purpose. Creates all suggested tasks under the goal. Assigns `colorIndex` to the goal. Optionally soft-deletes the originating inbox item.

---

## Modified Router: `task`

### task.update

Update task fields (for calendar edit modal).

**Input**:
```typescript
{
  id: string;
  title?: string;
  description?: string;
  scheduledDate?: string | null;
  scheduledStart?: string | null;
  scheduledDuration?: number | null;
  estimatedMinutes?: number | null;
}
```

**Output**:
```typescript
{
  task: Task;
}
```

**Behavior**: Updates only the provided fields. Updates `updatedAt` timestamp.

---

### task.getScheduled (MODIFIED)

**Input** (unchanged):
```typescript
{
  userId: string;
  startDate: string;
  endDate: string;
}
```

**Output** (add goalColorIndex):
```typescript
Array<{
  id: string;
  title: string;
  goalId: string;
  goalTitle: string;
  goalColorIndex: number; // NEW
  scheduledDate: string;
  scheduledStart: string | null;
  scheduledDuration: number | null;
  status: string;
  estimatedMinutes: number | null;
}>
```

**Behavior changes**:
- Add `goalColorIndex` to the returned data (join from goals table)
- Ensure soft-deleted goals and tasks are excluded
- Verify all goals' tasks are included (not just first N)

---

## Modified Router: `goal`

### goal.create (MODIFIED)

**Behavior change**: On creation, assign `colorIndex` as `(count of existing goals) % 10`.

### goal.list (MODIFIED)

**Output change**: Include `colorIndex` in returned goal objects.
