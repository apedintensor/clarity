# Quickstart: Load Conversation History in Message Mode

**Feature**: 015-load-chat-history
**Date**: 2026-02-16
**Purpose**: Demonstrate how to use conversation history in `--message` mode after implementation

## Overview

This feature enables `--message` mode to maintain conversation context across multiple invocations. Previously, each `--message` call was isolated; now, messages build on previous context.

## Prerequisites

- Clarity CLI installed and configured
- At least one inbox item created (via `clarity inbox add`)
- `GOOGLE_GENERATIVE_AI_API_KEY` set in `.env` file

## Basic Usage

### Scenario 1: Multi-Turn Conversation with Context

**Create an inbox item:**
```bash
clarity inbox add "I want to build a real-time collaboration tool"
# Output: Inbox item created (abc12345)
```

**First message (initial discussion):**
```bash
clarity chat abc12345 --message "What technologies should I consider?"
```

**Response (without prior context):**
```
AI: For a real-time collaboration tool, you should consider:
- WebSockets for real-time communication
- React or Vue for the frontend
- Node.js with Socket.io for the backend
- PostgreSQL or MongoDB for data persistence
Would you like me to help break this down into actionable tasks?
```

**Second message (building on context):**
```bash
clarity chat abc12345 --message "Yes, let's start with the WebSocket implementation"
```

**Response (WITH context from first exchange):**
```
AI: Great! Based on our discussion about building a real-time collaboration tool,
let's create a goal for the WebSocket implementation:

<suggestion>
Goal: "Implement WebSocket Backend for Real-Time Collaboration"
Purpose: Set up bidirectional communication between clients and server
Tasks:
  1. Set up Socket.io server with authentication (30 min)
  2. Implement room management for collaboration sessions (45 min)
  3. Create event handlers for real-time updates (60 min)
</suggestion>
```

**Key Difference**: The second response references "our discussion about building a real-time collaboration tool" because it has access to the first exchange.

---

### Scenario 2: JSON Output Mode

**For automation scripts that need structured output:**

```bash
# First exchange
clarity chat abc12345 --message "Suggest a goal for user authentication" --json
```

**Output:**
```json
{
  "response": "I can help you create a goal for user authentication...",
  "suggestions": [
    {
      "title": "Implement User Authentication",
      "purpose": "Secure user access to the application",
      "tasks": [...]
    }
  ]
}
```

**Follow-up with context:**
```bash
clarity chat abc12345 --message "Make it use OAuth2" --json
```

**Output (includes context metadata):**
```json
{
  "response": "I'll adjust the authentication goal to use OAuth2 instead...",
  "conversationContext": {
    "messageCount": 2,
    "conversationId": "def45678"
  },
  "suggestions": [...]
}
```

---

### Scenario 3: Handling Token Limits (Large Conversations)

**When a conversation has many messages:**

```bash
# After 30+ exchanges in the same conversation...
clarity chat abc12345 --message "Summarize our discussion so far"
```

**Behavior**:
- System automatically truncates oldest messages to fit within token limit
- Recent messages (most relevant context) are preserved
- User sees response based on recent context
- No error or warning (transparent truncation)

**If conversation is extremely long:**
```bash
clarity chat abc12345 --message "hello"
```

**Warning (if truncation is aggressive):**
```
⚠ Conversation history truncated to fit token limits. Recent context preserved.

AI: [response based on recent messages]
```

---

### Scenario 4: Error Handling

**Database connection failure:**
```bash
clarity chat abc12345 --message "hello"
```

**Output (graceful fallback):**
```
⚠ Could not load conversation history. Proceeding with current message only.

AI: [response without historical context]
```

**Non-existent inbox ID:**
```bash
clarity chat nonexistent --message "hello"
```

**Output (fail-fast):**
```
❌ Inbox item not found: nonexistent
```

---

## Comparison: Interactive vs --message Mode

### Interactive Mode

```bash
clarity chat abc12345
# Enters interactive session
You: What should I build?
AI: Tell me more about your goals...
You: A task management app
AI: Great! Let's break that down...
You: quit
```

**Context**: Maintained in-memory during the session, saved to database after each exchange.

### --message Mode (NEW with this feature)

```bash
clarity chat abc12345 --message "What should I build?"
# AI: Tell me more about your goals...

clarity chat abc12345 --message "A task management app"
# AI: Great! Let's break that down... [references "what should I build"]
```

**Context**: Loaded from database at the start of each invocation, saved after each exchange.

**Equivalence**: Both modes now provide identical context to the AI. Switching between them is seamless.

---

## Advanced Usage

### Piped Input with Context

```bash
echo "Create a goal for this feature" | clarity chat abc12345
# Uses conversation history from previous --message invocations
# AI response references prior context
```

### Scripted Automation

**Example script (`brainstorm-and-accept.sh`):**
```bash
#!/bin/bash
INBOX_ID=$1

# Initial brainstorm
clarity chat "$INBOX_ID" --message "Help me break this down into goals" --json > response1.json

# Refine based on AI suggestions
clarity chat "$INBOX_ID" --message "Make the first goal more specific" --json > response2.json

# Each subsequent call builds on previous context
```

### Debugging: View Conversation History

**Check how many messages are in the conversation:**
```bash
# (Assuming a future feature for listing messages)
clarity chat abc12345 --message "How many exchanges have we had?"
# AI: Based on our conversation history, we've had [N] exchanges so far.
```

---

## Performance Expectations

| Conversation Size | Load Time | Token Truncation | Response Time |
|-------------------|-----------|------------------|---------------|
| 1-10 messages     | < 50ms    | No               | ~2-5s (AI)    |
| 11-50 messages    | < 100ms   | No               | ~2-5s (AI)    |
| 51-100 messages   | < 200ms   | Possible         | ~2-5s (AI)    |
| 100+ messages     | < 300ms   | Yes (oldest)     | ~2-5s (AI)    |

**Note**: AI response time dominates total latency. History loading is negligible (< 200ms even for large conversations).

---

## Migration Guide (From 014-cli-chat-acceptance)

**Before (014-cli-chat-acceptance):**
```bash
# Each call was isolated, no context
clarity chat abc12345 --message "What tech should I use?"
clarity chat abc12345 --message "And what about databases?"  # AI doesn't remember first question
```

**After (015-load-chat-history):**
```bash
# Context is preserved
clarity chat abc12345 --message "What tech should I use?"
clarity chat abc12345 --message "And what about databases?"  # AI remembers tech discussion
```

**No Breaking Changes**: Existing workflows continue to work. The only difference is that AI responses now have access to prior context.

---

## Troubleshooting

**Q: AI responses don't seem to use prior context**

A: Verify the conversation is linked to the same inbox item:
```bash
# Both commands should use the same inbox ID
clarity chat abc12345 --message "first"
clarity chat abc12345 --message "second"  # Uses same ID
```

**Q: Warning about truncated conversation history**

A: Your conversation has many messages. This is normal and doesn't affect functionality. Recent context is preserved.

**Q: Error loading conversation history**

A: Check database permissions and file integrity:
```bash
# Ensure clarity.db is accessible
ls -l clarity.db
# Re-push schema if needed
pnpm db:push
```

---

## Next Steps

- Explore interactive mode: `clarity chat abc12345` (no --message flag)
- Accept AI suggestions to create goals: respond "yes" when prompted
- View created goals: `clarity goals list`
- Focus on a goal: `clarity focus <goalId>`
