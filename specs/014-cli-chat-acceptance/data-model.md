# Data Model: CLI Chat Acceptance & Inbox Workflow

**Feature**: 014-cli-chat-acceptance
**Date**: 2026-02-16

## Overview

No new database entities or schema changes are required. This feature operates entirely on existing tables and tRPC procedures. This document maps the existing entities involved in the CLI chat acceptance flow.

## Existing Entities Used

### Inbox Item

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| title | string (1-500) | Item title, becomes task/goal title on conversion |
| description | string (optional) | Extended description |
| status | enum: unprocessed, assigned, deleted | Tracks lifecycle |
| assignedGoalId | UUID (optional) | Set when assigned to a goal |
| assignedTaskId | UUID (optional) | Set when converted to a task |
| sortOrder | integer | For UI ordering |
| deletedAt | ISO datetime (optional) | Soft delete timestamp |
| createdAt | ISO datetime | |
| updatedAt | ISO datetime | |

**State transitions relevant to this feature**:
- `unprocessed` → `assigned` (via `assignToGoal`)
- `unprocessed` → soft-deleted (via `acceptSuggestion`, `convertToSubtask`)

### Conversation

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| inboxItemId | UUID | FK → inboxItems, links chat to inbox item |
| createdAt | ISO datetime | |
| updatedAt | ISO datetime | |

### Conversation Message

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| conversationId | UUID | FK → conversations |
| role | enum: user, assistant, system | Message author |
| content | string | Message text (may contain suggestion blocks) |
| createdAt | ISO datetime | |

### Goal (created by acceptSuggestion)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| userId | UUID | FK → users |
| brainDumpId | UUID | FK → brainDumps (auto-created anchor) |
| title | string | From suggestion.title |
| purpose | string | From suggestion.purpose |
| status | enum: active | Always created as active |
| colorIndex | integer (0-9) | Auto-assigned based on goal count |

### Task (created by acceptSuggestion / convertToSubtask)

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| goalId | UUID | FK → goals |
| parentTaskId | UUID (optional) | FK → tasks (set for subtasks) |
| title | string | From suggestion.tasks[].title or inbox item title |
| description | string (optional) | From suggestion.tasks[].description |
| estimatedMinutes | integer (5-120) | From suggestion or default 30 |
| status | enum: pending | Always created as pending |
| sortOrder | integer | Auto-incremented within goal |

## New Runtime Types (not persisted)

### Parsed Suggestion (in-memory only)

```
Suggestion {
  title: string          // Goal title
  purpose: string        // Goal purpose / emotional driver
  tasks: SuggestionTask[]
}

SuggestionTask {
  title: string
  description?: string
  estimatedMinutes: number (5-120, default 30)
}
```

This matches the existing Zod schema in `inbox.acceptSuggestion` input. The suggestion parser extracts this from AI response text and returns it for CLI display/acceptance.

## Entity Relationships

```
User ──1:N──> InboxItem ──1:1──> Conversation ──1:N──> ConversationMessage
User ──1:N──> Goal ──1:N──> Task
                              └──> Task (subtask, via parentTaskId)
```

## No Schema Migration Required

All tables and columns already exist. The feature adds no new columns, tables, or indexes.
