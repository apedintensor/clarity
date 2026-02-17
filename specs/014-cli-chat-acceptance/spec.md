# Feature Specification: CLI Chat Acceptance & Inbox Workflow

**Feature Branch**: `014-cli-chat-acceptance`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "Enable a complete CLI-only flow for inbox-linked brainstorming, multi-turn chat, and accepting output into tasks/subtasks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix Non-Interactive Chat Shutdown (Priority: P1)

A user pipes input into the chat command (e.g., `echo "my idea" | clarity chat <inboxId>`) or runs the chat in a scripted environment. The chat session processes the input and exits cleanly with exit code 0, without emitting readline errors or crashing.

**Why this priority**: A broken piped-input mode blocks all automation and scripted workflows. Without a clean shutdown, no downstream CLI integration is possible.

**Independent Test**: Can be fully tested by piping a single message into the chat command and verifying clean exit (code 0, no errors on stderr).

**Acceptance Scenarios**:

1. **Given** an inbox item exists, **When** a user pipes a message via `echo "brainstorm this" | clarity chat <inboxId>`, **Then** the system processes the message, displays the AI response, and exits with code 0 without any readline errors.
2. **Given** the chat is running interactively, **When** the user types `quit` or `q`, **Then** the session ends cleanly with exit code 0.
3. **Given** piped input ends (EOF), **When** the readline interface detects closed input, **Then** the chat gracefully shuts down without throwing "readline was closed" errors.

---

### User Story 2 - Accept Brainstorm Suggestions via CLI (Priority: P1)

A user has been brainstorming with the AI chat about an inbox item. The AI produces structured suggestions (goal + tasks). The user accepts a suggestion directly from the CLI, which creates the goal and associated tasks in the system.

**Why this priority**: This is the core value proposition — turning brainstorm output into actionable work items without leaving the terminal. Without this, the CLI chat is a dead end.

**Independent Test**: Can be tested by running a chat session, receiving a suggestion, and verifying that accepting it creates the expected goal and tasks in the database.

**Acceptance Scenarios**:

1. **Given** an AI response contains structured suggestions, **When** the chat command parses the response, **Then** the suggestions are displayed to the user with numbered options.
2. **Given** displayed suggestions, **When** the user selects a suggestion to accept, **Then** the system calls the accept-suggestion workflow and creates a new goal with associated tasks.
3. **Given** a suggestion is accepted, **When** the command completes, **Then** the system confirms creation by displaying the new goal ID and task IDs.
4. **Given** `--json` output mode, **When** a suggestion is accepted, **Then** the output includes `goalId` and `taskIds` as structured data.

---

### User Story 3 - Convert Inbox Item to Subtask (Priority: P2)

A user identifies that an inbox item should become a subtask of an existing task rather than a standalone task or goal. They run a CLI command to convert the inbox item into a subtask under a specified parent task.

**Why this priority**: Subtask conversion enables finer-grained task organization. It's valuable but secondary to the primary brainstorm-to-goal flow.

**Independent Test**: Can be tested by creating an inbox item, running the subtask conversion command with a parent task ID, and verifying the subtask appears under the correct parent.

**Acceptance Scenarios**:

1. **Given** an inbox item and an existing task, **When** the user runs `clarity inbox subtask <inboxId> --task <taskId>`, **Then** the inbox item is converted to a subtask of the specified task.
2. **Given** a successful conversion, **When** using `--json` output, **Then** the system returns the new subtask ID and parent task ID as structured data.
3. **Given** an invalid inbox ID or task ID, **When** the user runs the subtask command, **Then** the system displays a clear error message indicating which ID was not found.

---

### User Story 4 - Non-Interactive Chat Mode for Automation (Priority: P2)

A developer or automation script needs to send a single message to the AI chat without entering interactive mode. They use `--message` or `--stdin` flags to send input and receive structured output.

**Why this priority**: Enables integration with other tools and scripts. Important for power users and CI workflows but not essential for basic CLI usage.

**Independent Test**: Can be tested by running the chat with `--message "my idea"` and verifying the AI response is returned as structured output.

**Acceptance Scenarios**:

1. **Given** an inbox item, **When** the user runs `clarity chat <inboxId> --message "explore this idea"`, **Then** the system sends the message, displays the AI response, and exits without entering interactive mode.
2. **Given** `--stdin` flag, **When** input is provided via pipe, **Then** the system reads all piped input as the message and responds once.
3. **Given** `--json` flag combined with `--message`, **When** the command completes, **Then** the output is valid JSON containing the AI response text and any parsed suggestions.
4. **Given** no `--message` and no piped input, **When** `--stdin` is specified, **Then** the system reads from standard input until EOF.

---

### User Story 5 - Consistent Short-ID Resolution (Priority: P2)

All new CLI commands (subtask conversion, suggestion acceptance) correctly resolve short IDs (partial ID prefixes) for inbox items, tasks, and goals, consistent with existing command behavior.

**Why this priority**: Short IDs are essential for usability — users should not need to copy full UUIDs. Inconsistent behavior across commands creates confusion.

**Independent Test**: Can be tested by using short ID prefixes (e.g., first 4-6 characters) in each new command and verifying they resolve to the correct entities.

**Acceptance Scenarios**:

1. **Given** an inbox item with a known ID, **When** the user provides a short prefix of that ID to any CLI command, **Then** the system resolves it to the correct inbox item.
2. **Given** a short ID that matches multiple entities, **When** the user provides it, **Then** the system displays an error asking for a more specific ID.
3. **Given** a short ID that matches no entities, **When** the user provides it, **Then** the system displays a clear "not found" error.

---

### Edge Cases

- What happens when the AI response contains no structured suggestions? The chat continues normally without offering an accept prompt.
- What happens when the user tries to accept a suggestion for an inbox item that has already been processed? The system displays an error indicating the item is already processed.
- What happens when piped input contains multiple lines? All lines are treated as a single message (concatenated).
- What happens when the AI service is unavailable during chat? The system displays a user-friendly error and exits with a non-zero exit code.
- What happens when `--message` and `--stdin` are both provided? The `--message` flag takes precedence; `--stdin` is ignored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST gracefully handle readline closure when receiving piped input, exiting with code 0 on normal completion.
- **FR-002**: System MUST parse AI chat responses to detect structured suggestions (goal + tasks) embedded in the output.
- **FR-003**: System MUST allow users to accept a parsed suggestion, triggering creation of the corresponding goal and tasks.
- **FR-004**: System MUST provide a CLI command to convert an inbox item into a subtask of a specified parent task.
- **FR-005**: System MUST support `--message` flag for single-message non-interactive chat mode.
- **FR-006**: System MUST support `--stdin` flag to read chat input from standard input for scripted usage.
- **FR-007**: System MUST return structured JSON output (including `goalId`, `taskIds`, `subtaskId`) when `--json` flag is used with any new command.
- **FR-008**: System MUST resolve short ID prefixes consistently across all new and existing CLI commands using the shared ID resolution utility.
- **FR-009**: System MUST display clear error messages when referenced entities (inbox items, tasks, goals) are not found.
- **FR-010**: System MUST save all chat messages (user and assistant) to the conversation history, including in non-interactive mode.

### Key Entities

- **Inbox Item**: A captured idea or note that can be brainstormed on, converted to a goal/task/subtask, or deleted. Key attributes: text content, status (unprocessed/assigned/deleted), linked conversation.
- **Conversation**: A multi-turn chat session linked to an inbox item. Contains ordered messages from user and AI assistant.
- **Suggestion**: A structured AI output containing a proposed goal title, purpose, and list of tasks. Embedded within AI chat responses.
- **Subtask**: A task that is a child of another task, representing a finer-grained work item within a parent task's scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full flow from inbox idea to scheduled task entirely via CLI commands, without needing the web interface.
- **SC-002**: Piped chat commands exit cleanly (exit code 0) with no error output on stderr in 100% of normal-completion cases.
- **SC-003**: Suggestion acceptance creates the correct number of goals and tasks as specified in the suggestion structure, with 100% accuracy.
- **SC-004**: All new CLI commands support `--json` output that is valid, parseable JSON.
- **SC-005**: Short ID resolution works with as few as 4 characters across all CLI commands, provided the prefix is unambiguous.
- **SC-006**: Non-interactive chat mode (`--message` or `--stdin`) completes a single exchange and exits within the same time as a single interactive turn.
