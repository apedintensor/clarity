# OpenClaw Integration Plan

Date: 2026-02-17

## Recommendation
- Ship Clarity as an OpenClaw **plugin that exports a bundle of skills**. Each skill should call `@clarity/core` directly with `createCallerFactory(appRouter)(createContext())` so no HTTP server is required.
- Keep a shell fallback that invokes the existing CLI with `--json` flags (`clarity dump ...`, `clarity breakdown ...`) for environments where OpenClaw only runs commands.
- This keeps state in the existing `clarity.db` SQLite file, reuses all validation logic, and avoids duplicating the web app.

## Clarity integration points
- **State**: SQLite `clarity.db` at repo root via better-sqlite3/Drizzle. Current flow is single-user; `user.getOrCreate()` seeds the user.
- **API surface**: `@clarity/core` exports `appRouter`, `createCallerFactory`, and `createContext` (same pattern the CLI uses). No server is needed when invoked in-process.
- **AI deps**: `GOOGLE_GENERATIVE_AI_API_KEY` is required for AI flows (`braindump.process`, `goal.breakdown`, inbox chat). Non-AI commands work without it.

## Suggested OpenClaw skill bundle (per plugin)
- `capture_dump(text)` → `caller.braindump.create({ rawText })` (CLI: `clarity dump "<text>" --json`).
- `process_dump(dumpId)` → `caller.braindump.process({ id })`; use direct call to skip the CLI's interactive clarifications; requires AI key.
- `list_dumps(limit?)` → `caller.braindump.list({ limit })`.
- `breakdown_goal(goalId)` → `caller.goal.breakdown({ id })` (AI).
- `list_tasks(goalId)` / `complete_task(taskId)` → `caller.task.list/update/complete(...)`.
- `schedule_task(taskId, date, time?, duration?)` / `unschedule_task(taskId)` / `calendar(date?)` → `caller.task.schedule/unschedule/getScheduled`.
- `inbox_list/add/assign/subtask/delete` → map to `inbox.list/create/convertToTask/convertToSubtask/softDelete`.
- `chat_inbox(inboxId?, message)` → reuse `conversation` + `inbox` flows; format suggestions with `parseSuggestions` and `stripSuggestionBlock` from `@clarity/core` when exposing outputs.
- `plan_day(skip?, selections[])` → `dailyPlan.start/updateSelections/confirm/skip` to avoid interactive prompts in the CLI `plan` command.
- `progress_summary(days?)` → `progress.dashboard` and `progress.history`.

## Implementation sketch (plugin)
1) Initialize a single caller in the plugin constructor:
   ```ts
   import { appRouter, createCallerFactory, createContext } from "@clarity/core";
   const caller = createCallerFactory(appRouter)(createContext());
   ```
2) For each skill, accept plain inputs and return the caller result. Prefer JSON-safe objects (the CLI `formatJson` output is already stable if you shell out instead).
3) Read `GOOGLE_GENERATIVE_AI_API_KEY` and the path to `clarity.db` from env; surface clear errors when missing.
4) If OpenClaw needs command-mode execution, wrap the same skills with `clarity ... --json` and parse stdout; otherwise keep everything in-process for lower latency and no TTY prompts.
