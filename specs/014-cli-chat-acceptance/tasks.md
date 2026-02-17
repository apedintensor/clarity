# Tasks: CLI Chat Acceptance & Inbox Workflow

**Input**: Design documents from `/specs/014-cli-chat-acceptance/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared suggestion parser that multiple user stories depend on

- [x] T001 [P] Create suggestion parser with Zod validation in packages/core/src/ai/suggestion-parser.ts — implement `parseSuggestions(text: string)` that extracts JSON between `---SUGGESTIONS---` / `---END_SUGGESTIONS---` markers, parses with `JSON.parse()`, validates each element against the suggestion Zod schema (`{ title, purpose, tasks[] }`), and returns `Suggestion[] | null`
- [x] T002 [P] Export `parseSuggestions` from packages/core — add the export to the core package's public API (packages/core/src/index.ts or equivalent barrel file) so CLI can import it

**Checkpoint**: Shared suggestion parser available for US1 and US2

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix the readline/piped-input infrastructure that all chat modes depend on

**⚠️ CRITICAL**: Chat-related user stories (US1, US2, US4) all depend on reliable readline behavior

- [x] T003 Update `ask()` in packages/cli/src/utils/prompts.ts to handle EOF gracefully — wrap readline `question()` so that if the readline interface is closed (e.g., piped input ends), the promise resolves with an empty string instead of throwing. Add `rl.on('close', ...)` listener that sets a closed flag, and make `ask()` check this flag before calling `rl.question()`
- [x] T004 Update `createPrompt()` in packages/cli/src/utils/prompts.ts — when `process.stdin.isTTY` is false (piped input), configure readline to not output the prompt string to avoid polluting piped output

**Checkpoint**: Foundation ready — `ask()` and `createPrompt()` handle both TTY and piped input safely

---

## Phase 3: User Story 1 — Fix Non-Interactive Chat Shutdown (Priority: P1) 🎯 MVP

**Goal**: Piped input into `clarity chat` exits cleanly (code 0) with no readline errors

**Independent Test**: `echo "test" | clarity chat <inboxId>` returns AI response and exits with code 0, no stderr output

### Implementation for User Story 1

- [x] T005 [US1] Refactor chat command readline loop in packages/cli/src/commands/chat.ts — replace the current `while (running)` loop to detect when `ask()` returns empty string due to EOF (piped input closed) and break out of the loop cleanly instead of treating it as a quit command display. Ensure `rl.close()` is called in a `finally` block
- [x] T006 [US1] Switch chat command to use shared system prompt in packages/cli/src/commands/chat.ts — replace the inline system prompt with `INBOX_CHAT_SYSTEM_PROMPT` and `buildChatMessages()` imported from `@clarity/core` (packages/core/src/ai/inbox-chat.ts). This ensures AI responses include the `---SUGGESTIONS---` format instructions needed for US2
- [x] T007 [US1] Handle non-TTY single-message mode in packages/cli/src/commands/chat.ts — when `!process.stdin.isTTY` and no `--message`/`--stdin` flag is provided, read all piped stdin lines, concatenate as single message, send to AI, display response, and exit with code 0. This is the implicit piped mode (`echo "x" | clarity chat <id>`)

**Checkpoint**: `echo "brainstorm this" | clarity chat <inboxId>` works end-to-end, exits cleanly with code 0

---

## Phase 4: User Story 2 — Accept Brainstorm Suggestions via CLI (Priority: P1)

**Goal**: Users can accept AI-generated suggestions in chat to create goals + tasks

**Independent Test**: Start `clarity chat <inboxId>`, ask AI to suggest goals, accept a suggestion, verify goal and tasks created in DB

### Implementation for User Story 2

- [x] T008 [US2] Add suggestion detection to chat response handler in packages/cli/src/commands/chat.ts — after receiving each AI response, call `parseSuggestions(reply)` from `@clarity/core`. If suggestions are found, strip the raw suggestion block from displayed text and show a formatted summary instead (goal title, purpose, task count)
- [x] T009 [US2] Display parsed suggestions with numbered options in packages/cli/src/commands/chat.ts — for each suggestion found, display: `[1] Goal: "title" (N tasks)` with task titles listed below. Use `printInfo()` for formatting
- [x] T010 [US2] Add interactive acceptance prompt in packages/cli/src/commands/chat.ts — after displaying suggestions, prompt user with `confirm()` from prompts.ts: "Accept this suggestion? (y/n)". If multiple suggestions, ask for each one. On acceptance, call `caller.inbox.acceptSuggestion({ suggestion, inboxItemId })` with the parsed suggestion data and optional inbox item ID
- [x] T011 [US2] Display creation confirmation in packages/cli/src/commands/chat.ts — after successful `acceptSuggestion` call, use `printSuccess()` to show created goal ID (short, 8 chars) and each task ID. Format: `✓ Goal created (abc12345) with N tasks`
- [x] T012 [US2] Add `--json` flag to chat command in packages/cli/src/commands/chat.ts — add `.option("--json", "Output as JSON")` to the command definition. When `--json` is set and a suggestion is accepted, output `{ goalId, taskIds, response }` via `formatJson()` instead of human-readable text. In JSON mode, skip the interactive acceptance prompt and output the suggestion data for external processing

**Checkpoint**: Full brainstorm → accept → goal+tasks flow works in interactive chat mode

---

## Phase 5: User Story 3 — Convert Inbox Item to Subtask (Priority: P2)

**Goal**: `clarity inbox subtask <inboxId> --task <taskId>` converts inbox item to a subtask

**Independent Test**: Create inbox item, run subtask command with a parent task ID, verify subtask appears under correct parent

### Implementation for User Story 3

- [x] T013 [US3] Add `subtask` subcommand to inbox command group in packages/cli/src/commands/inbox.ts — add `inbox.command("subtask <id>").description("Convert an inbox item to a subtask").requiredOption("--task <taskId>", "Parent task ID").option("--json", "Output as JSON")`. Follow the existing pattern from `inbox convert` and `inbox assign` commands
- [x] T014 [US3] Implement subtask action handler in packages/cli/src/commands/inbox.ts — in the `.action()` callback: resolve both `id` (via `resolveId(id, "inbox")`) and `opts.task` (via `resolveId(opts.task, "task")`), call `caller.inbox.convertToSubtask({ inboxItemId, taskId })`, handle `--json` output with `formatJson()`, and display `printSuccess()` with subtask ID on success. Catch errors and display `printError()` with specific messages for NOT_FOUND cases

**Checkpoint**: `clarity inbox subtask <inboxId> --task <taskId>` creates subtask and returns confirmation

---

## Phase 6: User Story 4 — Non-Interactive Chat Mode for Automation (Priority: P2)

**Goal**: `--message` and `--stdin` flags enable scripted single-exchange chat

**Independent Test**: `clarity chat <inboxId> --message "suggest goals" --json` returns structured JSON response

### Implementation for User Story 4

- [x] T015 [US4] Add `--message` and `--stdin` options to chat command in packages/cli/src/commands/chat.ts — add `.option("--message <text>", "Send a single message without interactive mode")` and `.option("--stdin", "Read message from standard input")` to the command definition
- [x] T016 [US4] Implement `--message` non-interactive mode in packages/cli/src/commands/chat.ts — when `opts.message` is provided: skip readline loop entirely, use the message text as user input, call AI once via `generateText()`, save both messages to conversation (if linked to inbox item), parse suggestions from response, display response (or JSON if `--json`), and `process.exit(0)`
- [x] T017 [US4] Implement `--stdin` non-interactive mode in packages/cli/src/commands/chat.ts — when `opts.stdin` is set and `!opts.message`: read all of `process.stdin` until EOF by collecting chunks into a buffer, use concatenated input as the message, then follow the same single-exchange flow as `--message`. If both `--message` and `--stdin` are provided, `--message` takes precedence
- [x] T018 [US4] Ensure conversation persistence in non-interactive mode in packages/cli/src/commands/chat.ts — verify that `conversation.addMessage()` is called for both user and assistant messages even in `--message`/`--stdin` mode, so chat history is preserved for future sessions

**Checkpoint**: `clarity chat <id> --message "text" --json` and `echo "text" | clarity chat <id> --stdin --json` both work

---

## Phase 7: User Story 5 — Consistent Short-ID Resolution (Priority: P2)

**Goal**: All new commands resolve short ID prefixes via the shared `resolveId()` utility

**Independent Test**: Use 4-8 character ID prefixes with `inbox subtask`, `chat`, and verify correct entity resolution

### Implementation for User Story 5

- [x] T019 [US5] Verify short-ID resolution in subtask command in packages/cli/src/commands/inbox.ts — confirm that both `<id>` (inbox item) and `--task <taskId>` arguments pass through `resolveId()` with appropriate hints (`"inbox"` and `"task"` respectively). This should already be done in T014 but verify with manual testing using short prefixes
- [x] T020 [US5] Verify short-ID resolution in chat command in packages/cli/src/commands/chat.ts — confirm the existing `resolveId(inboxItemId, "inbox")` call works with short prefixes (4+ chars) in all modes: interactive, `--message`, and `--stdin`

**Checkpoint**: All CLI commands resolve short IDs consistently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling and end-to-end validation

- [x] T021 Handle edge case: AI response with no suggestions in packages/cli/src/commands/chat.ts — ensure that when `parseSuggestions()` returns `null`, the chat continues normally without any acceptance prompt. No error, no warning — just display the response as-is
- [x] T022 Handle edge case: already-processed inbox item in packages/cli/src/commands/chat.ts — when `acceptSuggestion` is called with an `inboxItemId` that has already been processed (soft-deleted), catch the tRPC error and display a user-friendly message: "This inbox item has already been processed"
- [x] T023 Handle edge case: `--message` and `--stdin` both provided in packages/cli/src/commands/chat.ts — add a check at the start of the action handler: if both flags are set, print a warning via `printInfo()` that `--message` takes precedence, then proceed with `--message` value
- [x] T024 Run quickstart.md end-to-end validation — execute the full flow from quickstart.md: `inbox add` → `chat` → accept suggestion → `schedule` → `done`. Verify each step works with both human-readable and `--json` output modes
- [x] T025 Build and lint validation — run `pnpm turbo build` and `npm run lint` to ensure all changes compile and pass linting in strict mode

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: No dependencies on Phase 1 (different files) — can start in parallel with Phase 1
- **US1 (Phase 3)**: Depends on Phase 2 (needs EOF-safe `ask()`)
- **US2 (Phase 4)**: Depends on Phase 1 (needs `parseSuggestions`) AND Phase 3 (needs working chat loop with shared system prompt)
- **US3 (Phase 5)**: Depends on nothing beyond existing codebase — can start after Phase 1 in parallel with US1
- **US4 (Phase 6)**: Depends on Phase 2 (needs piped input handling) AND Phase 3 (needs refactored chat command)
- **US5 (Phase 7)**: Depends on US3 and US4 (verifies their short-ID usage)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Phase 2 → US1 (readline fix must come first)
- **US2 (P1)**: Phase 1 + US1 → US2 (needs parser + working chat)
- **US3 (P2)**: Independent — only needs existing router
- **US4 (P2)**: Phase 2 + US1 → US4 (needs readline fix + chat refactor)
- **US5 (P2)**: US3 + US4 → US5 (verifies their implementations)

### Parallel Opportunities

```
Phase 1 (T001-T002) ──┬──────────────────────> US2 (T008-T012)
                       │
Phase 2 (T003-T004) ──┴──> US1 (T005-T007) ──> US4 (T015-T018) ──> US5 (T019-T020)
                                                                          │
                       US3 (T013-T014) ────────────────────────────────────┘
```

- T001-T002 can run in parallel with T003-T004 (different packages)
- T013-T014 (US3) can run in parallel with T005-T007 (US1) — different files
- T019-T020 (US5) are verification-only and run after their target stories

---

## Parallel Example: Phase 1 + Phase 2

```bash
# These can all start simultaneously (different files, no dependencies):
Task T001: "Create suggestion parser in packages/core/src/ai/suggestion-parser.ts"
Task T002: "Export parseSuggestions from packages/core"
Task T003: "Update ask() in packages/cli/src/utils/prompts.ts"
Task T004: "Update createPrompt() in packages/cli/src/utils/prompts.ts"
```

## Parallel Example: US1 + US3

```bash
# After foundational phase, these stories can proceed in parallel:
# Developer A: US1 — packages/cli/src/commands/chat.ts
Task T005: "Refactor chat command readline loop"
Task T006: "Switch to shared system prompt"
Task T007: "Handle non-TTY single-message mode"

# Developer B: US3 — packages/cli/src/commands/inbox.ts
Task T013: "Add subtask subcommand"
Task T014: "Implement subtask action handler"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (suggestion parser)
2. Complete Phase 2: Foundational (readline fix)
3. Complete Phase 3: US1 (piped chat works)
4. **STOP and VALIDATE**: `echo "test" | clarity chat <id>` exits cleanly

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Add US1 → Piped chat works (MVP!)
3. Add US2 → Suggestion acceptance works
4. Add US3 → Subtask conversion works (parallel with US1/US2)
5. Add US4 → `--message`/`--stdin` flags work
6. Add US5 → Short-ID verified across all
7. Polish → Edge cases handled, end-to-end validated

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new tRPC procedures needed — all backend operations already exist
- No schema/migration changes needed
- One new file created: `packages/core/src/ai/suggestion-parser.ts`
- Two files substantially modified: `chat.ts`, `inbox.ts`
- One file lightly modified: `prompts.ts`
- Commit after each phase or logical group
