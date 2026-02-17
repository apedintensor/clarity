# Research: Load Conversation History in Message Mode

**Feature**: 015-load-chat-history
**Date**: 2026-02-16
**Purpose**: Resolve technical uncertainties identified in plan.md before design phase

## Research Questions

### 1. Token Limit Management for Conversation History

**Question**: How should we efficiently manage conversation history when it approaches or exceeds the AI model's token limit (maxTokens: 1500)?

**Research Approach**:
- Analyze Vercel AI SDK token counting capabilities
- Review Gemini API documentation for context window limits
- Evaluate truncation strategies (oldest-first, summarization, sliding window)

**Findings**:

**Decision**: Use **oldest-first truncation** with a simple character-based estimation for token counting.

**Rationale**:
1. **Simplicity**: The Vercel AI SDK does not provide built-in token counting for the Gemini model. Implementing exact token counting would require additional dependencies (e.g., tiktoken or Gemini-specific tokenizers) and complexity.

2. **Character-based estimation**: Use a conservative 4:1 character-to-token ratio (common rule of thumb for English text). With maxTokens: 1500 for AI output, reserve approximately 1000 tokens for input (system prompt + conversation history + user message), which translates to ~4000 characters.

3. **Oldest-first truncation**: When conversation history exceeds the estimated token budget:
   - Calculate total characters in system prompt + all messages + new user message
   - If total > 4000 characters, remove oldest messages until within budget
   - Always preserve: system prompt, new user message, and at least the most recent assistant response
   - This maintains recency bias (recent context is more relevant) while avoiding complexity

4. **Graceful degradation**: If even truncated history is too large (unlikely with 4000 char budget), log a warning and proceed with just the system prompt + new message.

**Alternatives Considered**:
- **Summarization**: Use AI to summarize old messages before truncation. Rejected because it adds latency, cost, and complexity for minimal benefit in typical short conversations.
- **Exact token counting**: Use tiktoken or Gemini tokenizer. Rejected because it adds dependencies and the character-based estimation is sufficient for this use case.
- **Sliding window**: Keep only last N messages. Rejected because it loses important early context (e.g., original inbox item discussion) that may be referenced later.

**Implementation Notes**:
- Create a helper function `truncateHistoryToTokenLimit(messages, systemPrompt, newUserMessage)` that returns filtered messages
- Use conservative limits to avoid edge cases where estimation is inaccurate
- Include debug logging to track when truncation occurs for future optimization

---

### 2. Error Handling for Database Failures

**Question**: How should the system handle database errors when loading conversation messages (corrupted data, missing messages, query failures)?

**Research Approach**:
- Review existing error handling patterns in `packages/core/src/router/conversation.ts`
- Analyze Drizzle ORM error types and recovery strategies
- Consider user experience for CLI automation scenarios

**Findings**:

**Decision**: Use **graceful fallback with user notification** strategy.

**Rationale**:
1. **Existing pattern**: The current `conversation.getOrCreate` procedure throws errors on database failures, which propagates to the CLI and exits with a non-zero code. This is appropriate for `--message` mode automation where silent failures are dangerous.

2. **Graceful fallback for partial failures**: If messages can't be loaded but the conversation exists, proceed with an empty history and log a warning. This allows the user to continue the conversation even if history is temporarily unavailable.

3. **Fail-fast for critical errors**: If the conversation itself can't be retrieved or created, fail with a clear error message and exit code 1. This prevents data corruption and makes automation scripts aware of the failure.

**Error Handling Strategy**:
- **Try-catch around message loading**: Wrap the message retrieval in a try-catch block separate from conversation retrieval
- **On message load failure**: Log warning to stderr, set `chatHistory = []`, and continue with the single message exchange
- **On conversation retrieval failure**: Propagate error to user with clear message, exit code 1
- **Display to user**: In non-JSON mode, print warning: "⚠ Could not load conversation history. Proceeding with current message only."

**Alternatives Considered**:
- **Retry logic**: Retry database queries on failure. Rejected because SQLite failures are typically not transient (file corruption, permissions) and retries add latency.
- **Silent fallback**: Proceed without notification. Rejected because users in `--message` mode expect context retention; silent loss of context would cause confusing AI responses.

**Implementation Notes**:
- Use the existing `printError` and `printInfo` utilities from `packages/cli/src/utils/output.ts`
- Ensure error messages are machine-readable in `--json` mode (include error codes or types)
- Add error scenario tests to manual test script (`tests/cli/chat-history.test.sh`)

---

### 3. Message Ordering and Consistency

**Question**: How do we ensure conversation messages are always in chronological order, especially when messages might be created from different modes (interactive vs --message)?

**Research Approach**:
- Review existing `conversation.getOrCreate` implementation
- Analyze database schema indexes on `conversationMessages.createdAt`
- Consider clock skew and timestamp precision

**Findings**:

**Decision**: **Rely on database timestamp ordering** with an explicit `ORDER BY` clause.

**Rationale**:
1. **Existing implementation**: The `conversation.getOrCreate` procedure already uses `.orderBy(asc(schema.conversationMessages.createdAt))` (line 23 in conversation.ts), which ensures messages are returned in chronological order.

2. **Timestamp precision**: SQLite stores timestamps as ISO 8601 strings with millisecond precision (e.g., "2026-02-16T10:30:45.123Z"). This provides sufficient granularity for message ordering, even in rapid exchanges.

3. **Single-user system**: Since Clarity is local-first with no multi-user concurrency, there's no risk of clock skew across different machines. All messages are created with `new Date().toISOString()` on the same machine.

4. **Index support**: The database schema includes `index("idx_conv_msg_conversation").on(table.conversationId)` which optimizes the query for filtering by conversation ID. Adding `ORDER BY createdAt` uses the index efficiently.

**Decision Confirmation**: No changes needed. Continue using the existing `createdAt` ordering from the database.

**Alternatives Considered**:
- **Sequence numbers**: Add an integer sequence column to messages. Rejected because timestamp ordering is sufficient and adding sequence numbers increases complexity (need to track and increment sequence per conversation).
- **Client-side sorting**: Sort messages in the CLI after retrieval. Rejected because the database is the source of truth and should enforce ordering consistently.

**Implementation Notes**:
- No code changes required for message ordering
- Verify in tests that messages appear in chronological order when retrieved
- Document the reliance on `createdAt` ordering in code comments

---

## Summary of Decisions

| Research Area | Decision | Impact on Implementation |
|---------------|----------|--------------------------|
| **Token limit management** | Oldest-first truncation with 4:1 char-to-token estimation | Add `truncateHistoryToTokenLimit()` helper function |
| **Error handling** | Graceful fallback for message load failures, fail-fast for conversation failures | Try-catch around message loading, warning messages to user |
| **Message ordering** | Use existing database `ORDER BY createdAt ASC` | No code changes needed, verify in tests |

**All research questions resolved.** Ready to proceed to Phase 1: Design.
