# tRPC Procedures: Load Conversation History in Message Mode

**Feature**: 015-load-chat-history
**Date**: 2026-02-16
**Purpose**: Document existing tRPC procedures used by this feature (no new procedures needed)

## Existing Procedures (Used by Feature)

### conversation.getOrCreate

**Location**: `packages/core/src/router/conversation.ts` (lines 8-44)

**Type**: Mutation

**Input Schema**:
```typescript
z.object({
  inboxItemId: z.string().uuid()
})
```

**Return Type**:
```typescript
{
  conversation: {
    id: string;
    userId: string;
    inboxItemId: string;
    createdAt: string;
    updatedAt: string;
  };
  messages: Array<{
    id: string;
    conversationId: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
  }>;
}
```

**Behavior**:
1. Checks for existing conversation linked to the inbox item
2. If found, retrieves all messages ordered by `createdAt ASC` and returns conversation + messages
3. If not found, creates new conversation and returns it with empty messages array
4. Throws error if no user exists in database (should never happen in single-user system)

**Current Usage** (014-cli-chat-acceptance):
- CLI calls this procedure when starting a chat with an inbox ID
- Returned `messages` array is **currently ignored** by `--message` mode

**New Usage** (015-load-chat-history):
- CLI will use the returned `messages` array to populate `chatHistory` before sending to AI
- Enables context retention across multiple `--message` invocations

**Error Handling**:
- Database query errors propagate to CLI (fail-fast)
- Missing user throws error (prevents data corruption)

**Performance**:
- Query complexity: O(1) for conversation lookup (unique index), O(n) for message retrieval where n = message count
- Expected performance: < 20ms for conversations with 50 messages

---

### conversation.addMessage

**Location**: `packages/core/src/router/conversation.ts` (lines 46-71)

**Type**: Mutation

**Input Schema**:
```typescript
z.object({
  conversationId: z.string().uuid(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1)
})
```

**Return Type**:
```typescript
{
  message: {
    id: string;
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  };
}
```

**Behavior**:
1. Creates new message with generated UUID and current timestamp
2. Inserts message into `conversationMessages` table
3. Updates parent conversation's `updatedAt` timestamp
4. Returns the created message

**Current Usage**:
- CLI calls this procedure for both user and assistant messages in interactive mode
- CLI calls this procedure for both user and assistant messages in `--message` mode

**New Usage** (015-load-chat-history):
- No changes to how this procedure is called
- Messages saved via this procedure will be loaded by `getOrCreate` in subsequent `--message` invocations

**Error Handling**:
- Database insert errors propagate to CLI
- Validation errors (invalid UUID, empty content) return Zod validation errors

**Performance**:
- Insert complexity: O(1)
- Expected performance: < 10ms per message

---

## Procedure Call Flow (Updated)

### Non-Interactive Mode (--message) with History Loading

**Before** (014-cli-chat-acceptance):
```
User: clarity chat <inboxId> --message "What next?"
  │
  ├─► conversation.getOrCreate({ inboxItemId })
  │     └─► returns { conversation, messages: [...] }  ← ignored!
  │
  ├─► AI generateText({ system, messages: [newUserMsg] })  ← no history!
  │     └─► returns AI response
  │
  └─► conversation.addMessage({ conversationId, role: "user", content })
      conversation.addMessage({ conversationId, role: "assistant", content })
```

**After** (015-load-chat-history):
```
User: clarity chat <inboxId> --message "What next?"
  │
  ├─► conversation.getOrCreate({ inboxItemId })
  │     └─► returns { conversation, messages: [...] }  ← USED!
  │
  ├─► Transform messages to chatHistory
  │     - Filter: role !== "system"
  │     - Map: { role, content }
  │     - Truncate if needed (token limit)
  │
  ├─► AI generateText({
  │       system,
  │       messages: [...chatHistory, newUserMsg]  ← includes history!
  │     })
  │     └─► returns AI response (with context from previous turns)
  │
  └─► conversation.addMessage({ conversationId, role: "user", content })
      conversation.addMessage({ conversationId, role: "assistant", content })
```

---

## No New Procedures Required

This feature **does not require any new tRPC procedures**. All necessary database operations are already implemented:

- ✅ `conversation.getOrCreate` — Already loads messages from database
- ✅ `conversation.addMessage` — Already saves messages to database
- ✅ Message ordering — Already enforced by `ORDER BY createdAt ASC` in `getOrCreate`

The implementation is purely a **client-side change** in `packages/cli/src/commands/chat.ts` to use the existing data that's already being returned by the tRPC procedures.

---

## Type Safety Verification

**Existing Types** (no changes needed):
- Input validation: Zod schemas in `conversation.ts` ensure type safety at runtime
- Database types: Drizzle schema in `packages/db/src/schema.ts` is source of truth
- Shared types: `packages/types/src/conversation.ts` (if exists) or inferred from Drizzle schema

**TypeScript Strict Mode**: All existing procedures already comply with strict mode requirements. No type safety issues introduced by this feature.
