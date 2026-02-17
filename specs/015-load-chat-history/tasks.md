# Tasks: Load Conversation History in Message Mode

**Input**: Design documents from `/specs/015-load-chat-history/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Not explicitly requested in specification - manual CLI testing will be used for validation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Monorepo structure: `packages/cli/`, `packages/core/`, `packages/db/`, `packages/types/`
- Primary file: `packages/cli/src/commands/chat.ts`
- Test scripts: `tests/cli/`

---

## Phase 1: Setup (Verification)

**Purpose**: Verify existing infrastructure and prepare for implementation

- [x] T001 Verify existing tRPC procedures in packages/core/src/router/conversation.ts (getOrCreate returns messages array)
- [x] T002 [P] Review current chat.ts implementation in packages/cli/src/commands/chat.ts (handleSingleExchange function)
- [x] T003 [P] Verify database schema for conversationMessages in packages/db/src/schema.ts (confirms createdAt ordering)

**Checkpoint**: Infrastructure verified - all necessary components already exist

---

## Phase 2: User Story 1 - Context-Aware Non-Interactive Responses (Priority: P1) 🎯 MVP

**Goal**: Load persisted conversation messages in `--message` mode and include them as context when sending to AI

**Independent Test**: Send two sequential `--message` commands to the same inbox-linked conversation. The second AI response should reference context from the first message.

### Implementation for User Story 1

- [x] T004 [US1] Modify handleSingleExchange to extract messages from conversation.getOrCreate response in packages/cli/src/commands/chat.ts
- [x] T005 [US1] Transform database messages to chatHistory format (filter role, map to {role, content}) in packages/cli/src/commands/chat.ts
- [x] T006 [US1] Populate chatHistory array with transformed messages before adding new user message in packages/cli/src/commands/chat.ts
- [x] T007 [US1] Add error handling for message loading failures (graceful fallback to empty history) in packages/cli/src/commands/chat.ts
- [x] T008 [US1] Create manual test script tests/cli/chat-history-basic.sh to verify sequential --message calls preserve context

**Checkpoint**: At this point, `--message` mode loads conversation history. Test with two sequential messages - AI should reference prior context.

---

## Phase 3: User Story 2 - Handle Large Conversation Histories (Priority: P2)

**Goal**: Implement token limit management to prevent failures when conversation history exceeds AI model limits

**Independent Test**: Create a conversation with 50+ messages (exceeding token budget). Send a new `--message` and verify system handles gracefully without errors.

### Implementation for User Story 2

- [x] T009 [US2] Create truncateHistoryToTokenLimit helper function in packages/cli/src/commands/chat.ts
- [x] T010 [US2] Implement character-to-token estimation (4:1 ratio) in truncateHistoryToTokenLimit function
- [x] T011 [US2] Implement oldest-first truncation logic while preserving system prompt and new message in truncateHistoryToTokenLimit
- [x] T012 [US2] Integrate truncateHistoryToTokenLimit into handleSingleExchange before sending to AI in packages/cli/src/commands/chat.ts
- [x] T013 [US2] Add warning message when history is truncated in packages/cli/src/commands/chat.ts
- [x] T014 [US2] Create manual test script tests/cli/chat-history-large.sh to verify truncation with long conversations

**Checkpoint**: System handles large conversations (100+ messages) without errors. Recent context is preserved.

---

## Phase 4: User Story 3 - Consistent Behavior Between Interactive and Non-Interactive Modes (Priority: P2)

**Goal**: Ensure conversation history handling is identical in both interactive and `--message` modes

**Independent Test**: Start conversation in interactive mode, exit, send `--message` to same conversation. Verify AI response includes context from interactive session.

### Implementation for User Story 3

- [x] T015 [US3] Review interactive mode history handling in packages/cli/src/commands/chat.ts (lines 100-176)
- [x] T016 [US3] Verify interactive mode also loads conversation history on startup in packages/cli/src/commands/chat.ts
- [x] T017 [US3] Ensure consistent message transformation logic between interactive and non-interactive modes in packages/cli/src/commands/chat.ts
- [x] T018 [US3] Create manual test script tests/cli/chat-history-mode-switch.sh to verify switching between interactive and --message modes

**Checkpoint**: All user stories complete. Interactive and `--message` modes provide equivalent context to AI.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Finalize implementation and validate against success criteria

- [x] T019 [P] Add conversation metadata to JSON output (message count) in packages/cli/src/commands/chat.ts
- [x] T020 [P] Add debug logging for history loading and truncation in packages/cli/src/commands/chat.ts
- [x] T021 Update inline code comments in packages/cli/src/commands/chat.ts to document history loading flow
- [x] T022 Run all manual test scripts to validate success criteria from spec.md
- [x] T023 Verify quickstart.md examples work as documented
- [x] T024 Run `pnpm lint` and fix any linting issues in packages/cli/
- [x] T025 Run `pnpm build` to verify TypeScript compilation succeeds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion - Core functionality
- **User Story 2 (Phase 3)**: Depends on US1 completion - Builds on basic history loading
- **User Story 3 (Phase 4)**: Depends on US1 completion - Can run in parallel with US2 if desired
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs basic history loading working first)
- **User Story 3 (P2)**: Depends on US1 (needs basic history loading working first) - Can run in parallel with US2

### Within Each User Story

- US1: Verification → Message extraction → Transformation → Integration → Error handling → Testing
- US2: Helper function → Estimation logic → Truncation logic → Integration → Warning → Testing
- US3: Review → Verification → Consistency checks → Testing
- All tasks within a story should be done sequentially (modifying same file)

### Parallel Opportunities

- **Phase 1 Setup**: T002 and T003 can run in parallel (different files)
- **Phase 5 Polish**: T019, T020, and T021 can run in parallel (different concerns in same file, but separate sections)
- **User Stories 2 & 3**: After US1 completes, US2 and US3 can be worked on in parallel (different sections of chat.ts)

---

## Parallel Example: User Story 1

```bash
# US1 tasks must be sequential (same file, same function):
# T004 → T005 → T006 → T007 → T008

# But after US1 completes, can parallelize:
# Developer A: US2 (Token truncation helper)
# Developer B: US3 (Interactive mode consistency)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify infrastructure)
2. Complete Phase 2: User Story 1 (basic history loading)
3. **STOP and VALIDATE**: Test US1 independently with manual test script
4. Deploy/demo if ready - this alone delivers significant value

### Incremental Delivery

1. Complete Setup → Verify infrastructure
2. Add User Story 1 → Test independently → **Deploy/Demo (MVP!)**
   - At this point, `--message` mode works with conversation context
3. Add User Story 2 → Test independently → Deploy/Demo
   - Now handles large conversations gracefully
4. Add User Story 3 → Test independently → Deploy/Demo
   - Now consistent across all modes
5. Add Polish → Final validation → Production ready

### Parallel Team Strategy

With multiple developers (after US1):

1. Developer A completes Setup + US1
2. Once US1 is done:
   - Developer A: User Story 2 (token truncation)
   - Developer B: User Story 3 (mode consistency)
   - Developer C: Polish tasks (documentation, testing)
3. All work converges for final integration

---

## Notes

- All tasks modify `packages/cli/src/commands/chat.ts` - sequential execution within stories recommended
- No new tRPC procedures, database changes, or type definitions needed
- Existing infrastructure (conversation.getOrCreate) already returns messages array
- Manual testing via shell scripts since no automated tests requested in spec
- Character-based token estimation (4:1 ratio) is approximate but sufficient for this use case
- Focus on using existing data that's already being retrieved but not used
- Graceful error handling ensures system degrades cleanly if message loading fails

---

## Success Criteria Validation

After completing all tasks, verify against spec.md success criteria:

- **SC-001**: Second `--message` references first message context (95%+ cases) → Test with chat-history-basic.sh
- **SC-002**: History loads < 500ms for 50 messages → Measure in chat-history-large.sh
- **SC-003**: Handles 100 messages without errors → Test with chat-history-large.sh
- **SC-004**: Interactive and `--message` modes produce equivalent responses → Test with chat-history-mode-switch.sh
- **SC-005**: Zero data corruption switching modes → Verify database integrity in tests
- **SC-006**: Automated workflows succeed → Run scripted test scenarios

All manual test scripts should be created and executed to validate independent story completion.
