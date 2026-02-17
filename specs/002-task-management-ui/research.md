# Research: Task Management UI

**Feature**: 002-task-management-ui
**Date**: 2026-02-14

## R1: Drag-and-Drop Library

**Decision**: Pragmatic Drag and Drop (`@atlaskit/pragmatic-drag-and-drop`)

**Rationale**:
- Framework-agnostic core (vanilla JS/TS) — fully compatible with
  React 19 and Next.js 15 without peer dependency issues.
- Smallest bundle size (~4.7 kB core).
- Battle-tested at scale (powers Trello, Jira, Confluence).
- Headless approach — no style opinions, works perfectly with
  Tailwind CSS 4.
- Supports nested lists for subtask reordering.
- Touch + mouse support via native HTML5 drag-and-drop API.

**Alternatives considered**:

| Library | Why Rejected |
|---------|-------------|
| @dnd-kit/core | Active GitHub issue (#1511) — prevents upgrading to Next.js 15 / React 19. Peer dependency constraints not updated. |
| react-beautiful-dnd | Officially deprecated by Atlassian (archived April 2025). |
| @hello-pangea/dnd | Community fork of react-beautiful-dnd. Peer deps cap at React 18 — requires `--force` install. |

## R2: Calendar / Scheduling Component

**Decision**: FullCalendar v7 (`@fullcalendar/react`)

**Rationale**:
- v7 is fully implemented in React (no internal Preact), with
  working SSR and StrictMode support for React 19.
- Weekly + daily views, drag-and-drop scheduling, block resizing,
  and external drag-from-sidebar all built in.
- CSS import issues with Next.js resolved in v7 (scoped CSS
  modules).
- Most mature open-source JS scheduling library with extensive
  documentation.

**Alternatives considered**:

| Library | Why Rejected |
|---------|-------------|
| @schedule-x/react | Modern and lightweight (~3.4 kB), but smaller ecosystem, less mature docs, and drag-to-create requires premium plugin. |
| react-big-calendar | Older React patterns, SASS-based styling conflicts with Tailwind-first approach, no explicit React 19 compatibility info. |
| DayPilot | Full features require commercial license. Free version too limited for time-block interactions. |
| Custom build | Excessive development time for accessibility, time zones, and drag/resize edge cases. |

**FullCalendar packages needed**:
- `@fullcalendar/react` — React wrapper
- `@fullcalendar/daygrid` — month/day grid views
- `@fullcalendar/timegrid` — weekly/daily time-slot views
- `@fullcalendar/interaction` — drag, resize, external drop
- `temporal-polyfill` — peer dependency for v7

## R3: Toast / Undo Pattern

**Decision**: Sonner (`sonner`)

**Rationale**:
- Lightweight toast library built for React / Next.js.
- Supports action buttons (ideal for "Undo" on delete).
- Works with Tailwind CSS out of the box.
- Already widely adopted in the Next.js ecosystem (shadcn/ui
  default toast).

**Alternatives considered**:

| Library | Why Rejected |
|---------|-------------|
| react-hot-toast | Less flexible action button API for undo flows. |
| Custom implementation | Unnecessary when Sonner covers the exact use case. |
