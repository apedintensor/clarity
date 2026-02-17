# clarity Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-14

## Active Technologies
- TypeScript 5.6+ (strict mode) + Next.js 15 (App Router), tRPC v11, Drizzle ORM, Pragmatic Drag and Drop, FullCalendar v7, Sonner (002-task-management-ui)
- SQLite (via better-sqlite3 + Drizzle ORM) (002-task-management-ui)
- TypeScript 5.6+ (strict mode) + Next.js 15 (App Router), tRPC v11, Drizzle ORM, @atlaskit/pragmatic-drag-and-drop, Sonner (toasts) (003-unified-inbox-dnd)
- SQLite via better-sqlite3 + Drizzle ORM (003-unified-inbox-dnd)
- TypeScript 5.6+ (strict mode) + Next.js 15 (App Router), tRPC v11, Drizzle ORM, Vercel AI SDK 4.1+ (@ai-sdk/google), FullCalendar v6+ (dayGrid, timeGrid, interaction plugins), Sonner (toast), @atlaskit/pragmatic-drag-and-drop (004-inbox-ai-calendar-fix)
- TypeScript 5.6+ (strict mode) + Next.js 15 (App Router), tRPC v11, FullCalendar v6, Drizzle ORM (006-fix-calendar-ux)
- SQLite (better-sqlite3) (006-fix-calendar-ux)
- TypeScript 5.6+ (strict mode) + Commander 13+, tRPC v11, Vercel AI SDK 4.1+ (@ai-sdk/google), Zod, chalk (014-cli-chat-acceptance)
- SQLite (better-sqlite3) via Drizzle ORM (014-cli-chat-acceptance)
- TypeScript 5.6+ (strict mode) + Commander 13+, tRPC v11, Vercel AI SDK 4.1+ (@ai-sdk/google), Drizzle ORM 0.38+, better-sqlite3, Zod (015-load-chat-history)
- SQLite (via better-sqlite3 + Drizzle ORM) at project root (`clarity.db`) (015-load-chat-history)

- TypeScript 5.6+ (strict mode) + Next.js 15 (App Router), tRPC v11, Drizzle ORM, Vercel AI SDK, Commander (001-braindump-to-action)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.6+ (strict mode): Follow standard conventions

## Recent Changes
- 015-load-chat-history: Added TypeScript 5.6+ (strict mode) + Commander 13+, tRPC v11, Vercel AI SDK 4.1+ (@ai-sdk/google), Drizzle ORM 0.38+, better-sqlite3, Zod
- 014-cli-chat-acceptance: Added TypeScript 5.6+ (strict mode) + Commander 13+, tRPC v11, Vercel AI SDK 4.1+ (@ai-sdk/google), Zod, chalk
- 006-fix-calendar-ux: Added TypeScript 5.6+ (strict mode) + Next.js 15 (App Router), tRPC v11, FullCalendar v6, Drizzle ORM


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
