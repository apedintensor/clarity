# CLI Chat Acceptance Work Items

Date: 2026-02-16

## Goal
Enable a complete CLI-only flow for inbox-linked brainstorming, multi-turn chat, and accepting output into tasks/subtasks.

## Work Items

- [ ] Fix non-interactive chat shutdown in `packages/cli/src/commands/chat.ts`
  - Avoid `readline was closed` on piped input.
  - Exit code `0` when session ends normally.

- [ ] Add CLI command to accept brainstorm suggestions
  - Wire CLI to backend `inbox.acceptSuggestion`.
  - Return `goalId` and `taskIds` in `--json` mode.

- [ ] Add CLI command for subtask conversion
  - Wire CLI to backend `inbox.convertToSubtask`.
  - Suggested command: `clarity inbox subtask <inboxId> --task <taskId>`.

- [ ] Ensure short-ID resolution works for new commands
  - Resolve short inbox/task/goal IDs consistently.

- [ ] Add non-interactive chat mode
  - Support `--stdin` and/or `--message` for automation.
  - Support JSON output for AI response in scripted mode.

- [ ] Add verification tests
  - Multi-turn interactive chat.
  - Piped chat mode.
  - Accept suggestion → goal + tasks created.
  - Convert to subtask path works.

## Acceptance Checklist

- [ ] `chat <inboxId>` supports multi-turn interaction./
- [ ] Piped chat exits cleanly without readline errors.
- [ ] Suggestion acceptance from CLI creates goal/tasks.
- [ ] Subtask conversion command creates child task.
- [ ] New commands provide valid `--json` output.
- [ ] End-to-end CLI flow passes from inbox idea to scheduled task.
