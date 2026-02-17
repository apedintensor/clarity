# Feature Specification: Fix Inbox AI Chat — No AI Reply

**Feature Branch**: `005-fix-inbox-ai-chat`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "in the inbox when i open the chatbox on an item, there's no reply from ai."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Responds to User Messages in Inbox Chat (Priority: P1)

When a user opens the inbox chat modal (by double-clicking an inbox item) and sends a message, the AI must respond with a streamed reply that appears in the chat window. Currently, users send messages but receive no AI response — the chat is effectively one-way.

**Why this priority**: The inbox AI chat is a core feature (implemented in feature 004). Without AI replies, the entire brainstorming experience is broken — users cannot get coaching, expand ideas, or generate goals from inbox items.

**Independent Test**: Double-click any inbox item to open the chat modal, type "Hello, help me think about this" and press Send. The AI should respond with a streamed message within 5 seconds.

**Acceptance Scenarios**:

1. **Given** a user has an inbox item, **When** they double-click it and send a message in the chat, **Then** the AI responds with a relevant streamed reply that appears in the chat window.
2. **Given** a user sends a message, **When** the AI is generating a response, **Then** a "Thinking..." indicator is shown until the response begins streaming.
3. **Given** the AI service is unavailable or the API key is missing, **When** the user sends a message, **Then** a clear error message is displayed in the chat (not a silent failure).

---

### User Story 2 - AI Chat Continuity Across Sessions (Priority: P2)

When a user re-opens a chat for an inbox item they previously chatted about, the full conversation history should load and subsequent AI replies should account for the prior context.

**Why this priority**: Once the basic AI reply is working (US1), conversation persistence ensures a seamless multi-session brainstorming experience.

**Independent Test**: Open an inbox item chat, send two messages, close the modal, then re-open it. Previous messages should appear, and sending a new message should get an AI reply that references prior context.

**Acceptance Scenarios**:

1. **Given** a user previously chatted with the AI about an inbox item, **When** they re-open the chat modal for that item, **Then** all prior messages (user and AI) are displayed.
2. **Given** prior messages are loaded, **When** the user sends a new message, **Then** the AI reply reflects awareness of the earlier conversation.

---

### Edge Cases

- What happens when the AI service API key is not configured? The system should display a user-friendly error message rather than failing silently.
- What happens when the AI service returns an error mid-stream? The partial response should be preserved and an error indicator should be shown.
- What happens when the user sends multiple messages rapidly before the AI finishes responding? The system should queue or prevent duplicate submissions.
- What happens when the network connection is lost during streaming? The user should see a clear error state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST deliver AI-generated streamed responses to user messages sent from the inbox chat modal.
- **FR-002**: System MUST display a visible loading/thinking indicator while waiting for the AI to begin responding.
- **FR-003**: System MUST display a clear, user-friendly error message when the AI service fails or is unavailable (no silent failures).
- **FR-004**: System MUST persist both user and AI messages to the conversation record so they can be loaded in future sessions.
- **FR-005**: System MUST send the inbox item's original text as context so the AI can provide relevant coaching responses.
- **FR-006**: System MUST prevent the user from sending additional messages while an AI response is actively streaming.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user messages sent in the inbox chat receive a visible AI response (or a clear error message) within 10 seconds.
- **SC-002**: AI responses stream incrementally (word-by-word or chunk-by-chunk) so users see progress, not a blank wait followed by a full response.
- **SC-003**: Conversation history is fully preserved — re-opening a previously used chat shows all prior messages with zero data loss.
- **SC-004**: Error states are displayed in the chat UI within 5 seconds of a failure, with actionable guidance (e.g., "Check your API key" or "Try again").

## Assumptions

- The AI chat feature was implemented in feature 004 (inbox-ai-calendar-fix) and the UI components, conversation router, and streaming API route already exist.
- The root cause is likely in the streaming API route configuration, AI provider setup (API key), or the client-server communication between the `useChat` hook and the `/api/chat` endpoint.
- The AI provider is Google Gemini (gemini-2.0-flash) via the Vercel AI SDK.
- No changes to the chat UI layout or design are needed — only the data flow and error handling need fixing.
