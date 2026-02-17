# Research: Inbox AI Chat & Calendar Fixes

**Feature**: 004-inbox-ai-calendar-fix
**Date**: 2026-02-14

## Decision 1: Streaming Chat Architecture

**Decision**: Use Vercel AI SDK `useChat` hook on the client + Next.js API route (`/api/chat`) on the server with `streamText()`.

**Rationale**: The Vercel AI SDK provides a purpose-built `useChat` React hook that manages message state, streaming, loading states, and error handling out of the box. It expects a standard HTTP endpoint (not tRPC). This avoids building custom streaming infrastructure while maintaining the AI SDK's built-in optimizations (token-by-token rendering, automatic retry, abort controller support).

**Alternatives considered**:
- **tRPC subscription (WebSocket)**: tRPC v11 supports subscriptions, but requires additional WebSocket server setup and doesn't integrate with the AI SDK's `useChat` hook.
- **Custom SSE via tRPC middleware**: Possible but would require custom streaming logic and lose the `useChat` hook's state management.
- **Plain fetch with ReadableStream**: Works but reimplements what `useChat` provides for free.

## Decision 2: Conversation Storage Model

**Decision**: Store conversations in two tables — `conversations` (per inbox item) and `conversationMessages` (individual messages). Load full history when reopening a conversation.

**Rationale**: Storing messages in the database ensures conversation persistence across browser refreshes and modal close/reopen. One conversation per inbox item keeps the data model simple. Loading full history on open is acceptable since conversations are expected to be <100 messages.

**Alternatives considered**:
- **localStorage**: Would lose data on browser clear and can't be accessed from CLI.
- **Single JSON column on inbox items**: Simpler but harder to query, no indexing on message content.
- **External AI memory (Gemini context caching)**: Adds external dependency, doesn't persist locally.

## Decision 3: AI System Prompt for Brainstorming

**Decision**: Use a carefully crafted system prompt that instructs the AI to act as a personal growth coach / brainstorming partner. The prompt tells the AI to: (1) ask clarifying questions, (2) expand on ideas, (3) challenge limiting beliefs with empathy, (4) be realistic while encouraging, (5) suggest structured goals only when the user is ready or asks. When generating goals, the AI outputs a structured JSON block within the conversation that the frontend parses and renders as interactive suggestion cards.

**Rationale**: The system prompt approach keeps the AI flexible for free-form conversation while enabling structured output on demand. Using a JSON block within the conversation (wrapped in a known delimiter like `---SUGGESTIONS---`) allows the frontend to detect and render suggestions differently from regular chat messages.

**Alternatives considered**:
- **Separate "suggest goals" API call**: Would break conversation flow and require duplicating context.
- **Tool use / function calling**: Gemini supports it, but adds complexity; the delimiter approach is simpler for MVP.

## Decision 4: Calendar Task Display Fix

**Decision**: Modify `task.getScheduled` to properly join goals and return all scheduled tasks where the goal is active and not soft-deleted. The current implementation works correctly but may have a bug where goals with `deletedAt IS NOT NULL` still show tasks.

**Rationale**: After reviewing the code, `getScheduled` already joins the goals table and filters by date range. The actual issue of "missing a task from each goal" likely stems from the date range calculation on the frontend (using Sunday-based week start) or tasks not being scheduled. The fix should ensure: (1) date range uses Monday start, (2) all goals' tasks are included, (3) the query filters out soft-deleted goals and tasks.

**Alternatives considered**:
- **Fetch all tasks and filter client-side**: Would scale poorly with many tasks.
- **Separate query per goal**: Unnecessary N+1 queries.

## Decision 5: Goal Color Palette

**Decision**: Use a hardcoded palette of 10 distinct colors that work on both light and dark backgrounds. Assign `colorIndex` to goals sequentially (0-9), cycling when palette is exhausted. Store `colorIndex` as an integer column on the goals table.

**Rationale**: 10 colors provides enough visual distinction for typical use (most users have <10 active goals). Storing the index rather than the color value allows the palette to be updated without data migration. Sequential assignment ensures consistent colors per goal across sessions.

**Palette**:
```
0: #3B82F6 (blue)
1: #EF4444 (red)
2: #10B981 (emerald)
3: #F59E0B (amber)
4: #8B5CF6 (violet)
5: #EC4899 (pink)
6: #06B6D4 (cyan)
7: #F97316 (orange)
8: #6366F1 (indigo)
9: #14B8A6 (teal)
```

**Alternatives considered**:
- **User-chosen colors**: More flexible but adds UI complexity beyond scope.
- **Hash-based from goal ID**: Produces inconsistent colors that may clash.
- **CSS custom properties per goal**: Harder to use in FullCalendar event styling.

## Decision 6: FullCalendar Monday Start

**Decision**: Set `firstDay: 1` in FullCalendar configuration (1 = Monday per ISO 8601). Update the date range calculation in `calendar/page.tsx` to compute Monday-based week boundaries.

**Rationale**: FullCalendar natively supports `firstDay` option. Setting it to 1 makes Monday the first column. The frontend date range calculation currently uses `getDay()` which returns 0 for Sunday — this needs adjustment to compute the Monday of the current week.

**Alternatives considered**:
- **Locale-based detection**: Over-engineered for single-user local app with explicit Monday preference.

## Decision 7: Calendar Right-Click Context Menu

**Decision**: Reuse the existing `<ContextMenu>` component (from feature 003) on FullCalendar events. Attach `eventDidMount` callback to add a `contextmenu` event listener on each event DOM element. The context menu triggers tRPC mutations for Complete, Delete, and opens modals for Edit and Reschedule.

**Rationale**: FullCalendar doesn't provide a built-in right-click handler, but `eventDidMount` gives access to the rendered DOM element where we can attach native event listeners. Reusing the existing ContextMenu component maintains UI consistency.

**Alternatives considered**:
- **FullCalendar's `eventClick` with modifier key**: Not intuitive for right-click.
- **Custom event renderer**: Would require replacing FullCalendar's default rendering, adding complexity.

## Decision 8: Subtask Support for Inbox Conversion

**Decision**: Add an optional `parentTaskId` column to the tasks table. When converting an inbox item to a subtask, create a task with `parentTaskId` set to the chosen parent task. Subtasks appear indented under their parent in the goal detail view.

**Rationale**: The existing task model doesn't support hierarchy. Adding a single nullable foreign key is the simplest way to support one level of nesting. This aligns with the spec's requirement for "Convert to Subtask" while keeping the data model flat enough to avoid recursive query complexity.

**Alternatives considered**:
- **Separate subtasks table**: Would duplicate the task schema unnecessarily.
- **Nested JSON within task**: Loses queryability and type safety.
- **Multi-level hierarchy (adjacency list)**: Over-engineered for the use case; one level of nesting is sufficient.
