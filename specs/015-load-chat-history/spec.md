# Feature Specification: Load Conversation History in Message Mode

**Feature Branch**: `015-load-chat-history`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "In --message mode (non-interactive), load persisted conversation history before sending to the AI to enable multi-turn conversations with context from previous exchanges."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Context-Aware Non-Interactive Responses (Priority: P1)

A developer or automation script sends multiple sequential messages to an inbox-linked chat conversation using `--message` mode. Each message builds on the previous context, and the AI responses reflect the full conversation history rather than treating each message as an isolated exchange.

**Why this priority**: This is the core value proposition. Without conversation history, `--message` mode is fundamentally broken for any multi-turn conversation use case. Automation scripts and CLI workflows become impossible when each invocation loses all context.

**Independent Test**: Can be fully tested by sending two sequential `--message` commands to the same conversation and verifying the second response references context from the first exchange.

**Acceptance Scenarios**:

1. **Given** an inbox-linked conversation with no prior messages, **When** a user runs `clarity chat <inboxId> --message "I want to build a task manager"`, **Then** the system saves the user message and AI response to the conversation history in the database.
2. **Given** a conversation with one prior exchange, **When** a user runs `clarity chat <inboxId> --message "What technology should I use?"`, **Then** the system loads the previous exchange, sends it as context to the AI along with the new message, and the AI response references the earlier discussion about building a task manager.
3. **Given** a conversation with multiple exchanges, **When** the user sends a new `--message`, **Then** all previous messages are included in chronological order as context for the AI.
4. **Given** a general brainstorm session (no inbox ID), **When** the user sends messages in `--message` mode, **Then** conversation history is not loaded because there is no persistent conversation to link to.

---

### User Story 2 - Handle Large Conversation Histories (Priority: P2)

A user has an ongoing conversation with many exchanges. When sending a new message via `--message` mode, the system intelligently manages the conversation history to fit within AI model token limits while preserving the most relevant context.

**Why this priority**: This prevents system failures when conversations grow beyond the AI's context window. It's essential for long-running conversations but secondary to basic history loading functionality.

**Independent Test**: Can be tested by creating a conversation with messages totaling more than 1500 tokens (the current maxTokens setting) and verifying the system handles it gracefully without errors.

**Acceptance Scenarios**:

1. **Given** a conversation history that exceeds the AI model's token limit, **When** the user sends a new `--message`, **Then** the system includes the most recent messages that fit within the token budget while maintaining chronological order.
2. **Given** a very long conversation history, **When** loading messages for AI context, **Then** the system includes the system prompt, recent conversation history, and the new user message without exceeding token limits.
3. **Given** a conversation that would exceed token limits even with truncation, **When** the user sends a new message, **Then** the system displays a clear error indicating the conversation is too long and suggests starting a new conversation.

---

### User Story 3 - Consistent Behavior Between Interactive and Non-Interactive Modes (Priority: P2)

A user switches between interactive mode and `--message` mode for the same inbox-linked conversation. Both modes provide equivalent context to the AI, ensuring response quality and continuity are identical regardless of interaction method.

**Why this priority**: Consistency across modes prevents user confusion and ensures the CLI is predictable. However, it's secondary to getting basic `--message` history loading working.

**Independent Test**: Can be tested by running an interactive session, then sending a `--message` to the same conversation, and verifying both receive the same conversation history context.

**Acceptance Scenarios**:

1. **Given** a conversation started in interactive mode with several exchanges, **When** the user exits and later sends a `--message` to the same conversation, **Then** the AI response reflects the full conversation history from the interactive session.
2. **Given** a conversation started with `--message` mode, **When** the user switches to interactive mode for the same conversation, **Then** the interactive session includes all prior `--message` exchanges in the chat history.
3. **Given** messages saved in both interactive and `--message` modes, **When** viewing conversation history, **Then** all messages appear in chronological order regardless of which mode created them.

---

### Edge Cases

- What happens when the conversation database table is corrupted or messages are missing? The system should log a warning and proceed with available messages, treating gaps as if the conversation started at the first available message.
- What happens when the user provides an inbox ID that has no linked conversation yet? The system should behave as it currently does: create a new conversation and proceed with the single message.
- What happens when messages are stored in the wrong order (database corruption)? The system should sort messages by timestamp before building the chat history to ensure chronological order.
- What happens when the AI service is unavailable after loading conversation history? The system displays an error without corrupting the conversation history, allowing retry without data loss.
- What happens when `--json` output is requested with conversation history? The system should include conversation metadata (message count, total tokens if available) in the JSON output alongside the AI response.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST load all persisted conversation messages from the database when a conversationId exists in `--message` mode.
- **FR-002**: System MUST include loaded conversation messages in the AI request context in chronological order (oldest to newest).
- **FR-003**: System MUST preserve the existing behavior of saving new user messages and AI responses to the conversation database.
- **FR-004**: System MUST handle conversations with no prior messages (newly created conversations) without errors.
- **FR-005**: System MUST sort loaded messages by creation timestamp before building the chat history to ensure chronological consistency.
- **FR-006**: System MUST respect token limits by truncating conversation history from the oldest messages when necessary while preserving the system prompt and new user message.
- **FR-007**: System MUST maintain consistent conversation history handling between interactive mode and `--message` mode.
- **FR-008**: System MUST not load conversation history when no inbox ID is provided (general brainstorm sessions remain stateless in `--message` mode).
- **FR-009**: System MUST display clear error messages when conversation history cannot be loaded due to database errors, without blocking the user from sending new messages.
- **FR-010**: System MUST include conversation metadata (e.g., number of prior messages loaded) in `--json` output when conversation history is present.

### Key Entities

- **Conversation**: A persistent multi-turn chat session linked to an inbox item. Contains ordered messages from user and AI assistant, system prompt context, and metadata (creation time, last updated).
- **Conversation Message**: A single turn in a conversation. Key attributes: role (user/assistant), content (message text), timestamp (creation order), conversationId (parent conversation).
- **Chat History**: The in-memory representation of conversation messages formatted for AI model consumption. Built from persisted conversation messages plus the current user input.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When a user sends a second `--message` to an inbox-linked conversation, the AI response references context from the first message in at least 95% of test cases.
- **SC-002**: Conversation history loading completes within 500ms for conversations with up to 50 messages.
- **SC-003**: The system handles conversations with up to 100 messages without errors or degraded performance (response time within 2x of single-message baseline).
- **SC-004**: Interactive mode and `--message` mode produce equivalent AI responses when given the same conversation history (measured by response similarity > 90% using semantic comparison).
- **SC-005**: Zero conversation history corruption or message loss when switching between interactive and `--message` modes (100% data integrity in test scenarios).
- **SC-006**: Users can complete multi-turn automated workflows via `--message` mode without manual intervention (100% success rate for scripted test workflows).
