# Data Model: Load Conversation History in Message Mode

**Feature**: 015-load-chat-history
**Date**: 2026-02-16
**Purpose**: Document data structures used by this feature (primarily existing entities)

## Existing Entities (No Changes Required)

### Conversation

Represents a persistent multi-turn chat session linked to an inbox item.

**Source**: `packages/db/src/schema.ts` (lines 140-152)

**Fields**:
- `id` (text, primary key) — UUID identifying the conversation
- `userId` (text, not null, foreign key → users.id) — Owner of the conversation (single user system)
- `inboxItemId` (text, not null, foreign key → inboxItems.id) — The inbox item this conversation discusses
- `createdAt` (text, not null) — ISO 8601 timestamp when conversation started
- `updatedAt` (text, not null) — ISO 8601 timestamp of last message added

**Indexes**:
- `uniqueIndex("idx_conversation_inbox_item").on(table.inboxItemId)` — Ensures one conversation per inbox item

**Constraints**:
- One-to-one relationship with inbox items (enforced by unique index)
- One-to-many relationship with conversation messages

**Validation Rules**:
- `id` must be a valid UUID (enforced at application level via `uuid()`)
- `userId`, `inboxItemId` must reference existing records
- `createdAt` and `updatedAt` must be valid ISO 8601 timestamps

---

### Conversation Message

Represents a single turn (user or assistant message) in a conversation.

**Source**: `packages/db/src/schema.ts` (lines 154-166)

**Fields**:
- `id` (text, primary key) — UUID identifying the message
- `conversationId` (text, not null, foreign key → conversations.id) — Parent conversation
- `role` (text enum: ["user", "assistant", "system"], not null) — Message sender
- `content` (text, not null) — Message text content
- `createdAt` (text, not null) — ISO 8601 timestamp when message was created

**Indexes**:
- `index("idx_conv_msg_conversation").on(table.conversationId)` — Optimizes queries filtering by conversation ID

**Constraints**:
- Many-to-one relationship with conversations
- Ordered by `createdAt` in chronological order (oldest to newest)

**Validation Rules**:
- `id` must be a valid UUID
- `conversationId` must reference an existing conversation
- `role` must be one of: "user", "assistant", "system"
- `content` must be non-empty string (min length 1)
- `createdAt` must be valid ISO 8601 timestamp

**State Transitions**: N/A (messages are immutable once created; no updates or deletions)

---

### Chat History (In-Memory Representation)

Represents the formatted conversation context sent to the AI model.

**Source**: `packages/cli/src/commands/chat.ts` (line 79)

**Type Definition**:
```typescript
Array<{ role: "user" | "assistant"; content: string }>
```

**Purpose**: Intermediate data structure that bridges persisted `ConversationMessage` records and the format expected by Vercel AI SDK's `generateText()` function.

**Transformation**:
- Input: Array of `ConversationMessage` from database (includes `id`, `conversationId`, `createdAt`, `role`, `content`)
- Output: Array of objects with only `role` and `content` fields
- Filtering: Exclude "system" role messages (system prompt is passed separately to `generateText`)

**Example**:
```typescript
// Database records (simplified)
const dbMessages = [
  { id: "...", conversationId: "...", role: "user", content: "I want to build a task manager", createdAt: "2026-02-16T10:00:00Z" },
  { id: "...", conversationId: "...", role: "assistant", content: "That's a great idea! What features...", createdAt: "2026-02-16T10:00:05Z" }
];

// Transformed for AI SDK
const chatHistory = [
  { role: "user", content: "I want to build a task manager" },
  { role: "assistant", content: "That's a great idea! What features..." }
];
```

---

## Data Flow

### Loading Conversation History (Modified Flow)

**Current Flow** (014-cli-chat-acceptance):
1. User runs `clarity chat <inboxId> --message "hello"`
2. CLI calls `conversation.getOrCreate({ inboxItemId })`
3. tRPC procedure returns `{ conversation, messages }` (messages are ignored)
4. CLI creates empty `chatHistory = []`
5. CLI sends only new user message to AI (no context)

**New Flow** (015-load-chat-history):
1. User runs `clarity chat <inboxId> --message "hello"`
2. CLI calls `conversation.getOrCreate({ inboxItemId })`
3. tRPC procedure returns `{ conversation, messages }` (messages used!)
4. CLI transforms `messages` → `chatHistory` array
5. CLI applies token limit truncation if needed
6. CLI sends system prompt + `chatHistory` + new user message to AI

**Diagram**:
```
┌─────────────────────────────────────────────────────────────┐
│ CLI: chat.ts --message mode                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. conversation.getOrCreate(inboxId) ──► tRPC            │
│                                            │               │
│  2. ◄─── { conversation, messages[] }      │               │
│                                                             │
│  3. Transform messages[] ──► chatHistory[]                │
│     - Filter: exclude role="system"                        │
│     - Map: { role, content } only                          │
│                                                             │
│  4. Truncate if needed ──► truncated chatHistory[]        │
│     - Estimate tokens (4 chars = 1 token)                  │
│     - Remove oldest messages if > budget                   │
│                                                             │
│  5. Send to AI:                                            │
│     - system: systemPrompt                                 │
│     - messages: chatHistory + new user message             │
│                                                             │
│  6. Save response ──► conversation.addMessage()           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

**Query Performance**:
- Loading 50 messages from SQLite with index: ~5-20ms (well under 200ms target)
- Transformation to chatHistory array: O(n) where n = message count, negligible overhead
- Token counting estimation: O(n * m) where m = avg message length, ~1-5ms for typical conversations

**Memory Usage**:
- 100 messages × 500 chars avg = 50KB in memory (negligible)
- No streaming or pagination needed for expected conversation sizes (1-100 messages)

**Scalability**:
- Current approach scales to ~500 messages before hitting memory/performance concerns
- If conversations grow beyond 100 messages, consider implementing pagination in tRPC procedure
- Token limit truncation naturally bounds memory usage regardless of conversation size
