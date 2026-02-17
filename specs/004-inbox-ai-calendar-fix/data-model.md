# Data Model: Inbox AI Chat & Calendar Fixes

**Feature**: 004-inbox-ai-calendar-fix
**Date**: 2026-02-14

## Schema Changes

### New Table: `conversations`

Stores one conversation per inbox item for AI chat sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY, UUID | Unique conversation identifier |
| userId | text | NOT NULL, FK → users.id | Owner of the conversation |
| inboxItemId | text | NOT NULL, FK → inboxItems.id | The inbox item this conversation is about |
| createdAt | text | NOT NULL, DEFAULT now | ISO timestamp of conversation start |
| updatedAt | text | NOT NULL, DEFAULT now | ISO timestamp of last message |

**Indexes**: Unique index on `inboxItemId` (one conversation per inbox item).

### New Table: `conversationMessages`

Individual messages within a conversation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | text | PRIMARY KEY, UUID | Unique message identifier |
| conversationId | text | NOT NULL, FK → conversations.id | Parent conversation |
| role | text | NOT NULL, CHECK('user','assistant','system') | Message sender role |
| content | text | NOT NULL | Message text content |
| createdAt | text | NOT NULL, DEFAULT now | ISO timestamp |

**Indexes**: Index on `conversationId` for message retrieval. Messages ordered by `createdAt ASC`.

### Modified Table: `goals`

| Column | Type | Change | Description |
|--------|------|--------|-------------|
| colorIndex | integer | ADD, NOT NULL, DEFAULT 0 | Index into the color palette (0-9) for calendar display |

### Modified Table: `tasks`

| Column | Type | Change | Description |
|--------|------|--------|-------------|
| parentTaskId | text | ADD, NULLABLE, FK → tasks.id | Parent task for subtask hierarchy (one level deep) |

## Entity Relationships

```
users (1) ──── (N) conversations
conversations (1) ──── (1) inboxItems
conversations (1) ──── (N) conversationMessages
goals (1) ──── (N) tasks
tasks (1) ──── (N) tasks (via parentTaskId, one level)
```

## Type Definitions

### Conversation

```typescript
interface Conversation {
  id: string;
  userId: string;
  inboxItemId: string;
  createdAt: string;
  updatedAt: string;
}
```

### ConversationMessage

```typescript
interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}
```

### Goal (modified)

```typescript
interface Goal {
  // ...existing fields
  colorIndex: number; // 0-9, index into color palette
}
```

### Task (modified)

```typescript
interface Task {
  // ...existing fields
  parentTaskId: string | null; // null = top-level task, set = subtask
}
```

## State Transitions

### Conversation Lifecycle

```
(none) → Created (on first double-click of inbox item)
Created → Active (messages being exchanged)
Active → Active (more messages added)
Active → Inactive (modal closed, conversation preserved)
Inactive → Active (modal reopened, conversation restored)
```

No explicit status column needed — presence of messages indicates activity. Conversations are never deleted (tied to inbox item lifecycle).

### AI Suggestion States (client-side only)

```
pending → accepted (user clicks Accept → goal/tasks created)
pending → modified (user edits suggestion → modified version saved)
pending → rejected (user clicks Reject → removed from UI)
```

AI suggestions are ephemeral — they exist only in the chat message content as structured data. Accepted suggestions become real goals/tasks in the database.
