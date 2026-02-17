# Research: CLI Chat Acceptance & Inbox Workflow

**Feature**: 014-cli-chat-acceptance
**Date**: 2026-02-16

## R1: Readline Shutdown on Piped Input

**Decision**: Detect piped (non-TTY) stdin via `process.stdin.isTTY` and handle the `close` event on readline to prevent "readline was closed" errors.

**Rationale**: When stdin is piped, Node.js readline emits `close` when the pipe ends. The current chat command does not listen for this event, causing the `ask()` promise to never resolve (or reject with an error). By:
1. Listening for `rl.on('close', ...)` to set a running flag to false
2. Wrapping `ask()` to resolve with empty string on close
3. Detecting `!process.stdin.isTTY` to automatically switch to single-message mode

The chat exits cleanly with code 0.

**Alternatives considered**:
- Using `process.stdin.on('end')` directly — less reliable since readline buffers input
- Switching to a third-party readline alternative (e.g., `inquirer`) — unnecessary complexity for this use case

## R2: Suggestion Block Parsing

**Decision**: Create a dedicated parser function in `packages/core/src/ai/suggestion-parser.ts` that uses regex to extract the JSON block between `---SUGGESTIONS---` and `---END_SUGGESTIONS---` markers.

**Rationale**: The system prompt in `inbox-chat.ts` already defines the exact format. Parsing is straightforward:
1. Regex: `/---SUGGESTIONS---\s*([\s\S]*?)\s*---END_SUGGESTIONS---/`
2. `JSON.parse()` the captured group
3. Validate against the same Zod schema used by `inbox.acceptSuggestion`
4. Return `null` if no block found or parsing fails

Placing this in `core` (not `cli`) allows both CLI and web to reuse the same parser.

**Alternatives considered**:
- Inline parsing in chat.ts — violates "shared core" principle
- Streaming token-by-token detection — over-engineered for non-streaming `generateText` usage

## R3: Non-Interactive Chat Mode Flags

**Decision**: Add `--message <text>` and `--stdin` options to the `chat` command. When either is provided, skip the interactive readline loop: send one message, display the response, and exit.

**Rationale**: Commander supports `.option("--message <text>")` and `.option("--stdin")` natively. Implementation:
- `--message`: Use provided text directly as user input
- `--stdin`: Read all of `process.stdin` until EOF via `Readable.toArray()` or manual buffering
- Priority: `--message` > `--stdin` > interactive mode
- Both flags combine with `--json` for structured output

**Alternatives considered**:
- Separate `chat-once` command — more CLI surface area to maintain, less discoverable
- Only `--stdin` without `--message` — `--message` is simpler for scripting one-liners

## R4: Subtask Command Pattern

**Decision**: Add `inbox subtask <inboxId> --task <taskId>` as a new subcommand under the existing `inbox` command group.

**Rationale**: Follows the established pattern in `inbox.ts` where each operation is a subcommand (`add`, `convert`, `assign`, `delete`). The router procedure `inbox.convertToSubtask` already exists and accepts `{ inboxItemId, taskId }`. Both IDs go through `resolveId()` for short-ID support.

**Alternatives considered**:
- Top-level `subtask` command — breaks the `inbox <action>` grouping convention
- Adding `--as subtask` flag to `inbox assign` — conflates two different operations (assign to goal vs. convert to subtask)

## R5: Existing Router Coverage

**Decision**: No new tRPC procedures needed. All required backend operations already exist.

**Rationale**: After reviewing `packages/core/src/router/inbox.ts`:
- `inbox.acceptSuggestion` — creates goal + tasks from suggestion JSON, optionally soft-deletes inbox item. Returns `{ goalId, taskIds }`.
- `inbox.convertToSubtask` — converts inbox item to subtask under parent task. Returns `{ subtaskId }`.
- `conversation.getOrCreate` — gets or creates conversation for inbox item.
- `conversation.addMessage` — saves chat messages.

All Zod schemas match the expected input shapes. No modifications to `core/router/` are needed.

## R6: Chat System Prompt Usage

**Decision**: Update chat.ts to use the shared `INBOX_CHAT_SYSTEM_PROMPT` and `buildChatMessages()` from `packages/core/src/ai/inbox-chat.ts` instead of the inline system prompt.

**Rationale**: The current chat.ts defines its own simpler system prompt that lacks the suggestion format instructions. The `inbox-chat.ts` module already has the complete prompt with `---SUGGESTIONS---` format documentation. Using the shared prompt ensures the AI knows how to generate parseable suggestions.

**Alternatives considered**:
- Duplicating the suggestion format in chat.ts — violates DRY, creates drift risk
