# Data Model: Braindump to Action

**Branch**: `001-braindump-to-action` | **Date**: 2026-02-14

## Entity Relationship Diagram

```text
User (1) ──── (N) BrainDump (1) ──── (N) Clarification
                    │
                    │ (1:N)
                    ▼
                  Goal (1) ──── (N) Task
                    │
                    │ (1:N)
                    ▼
              ProgressRecord
```

## Entities

### User

The person using Clarity. Single-user app, but modeled as an entity
for future extensibility and clean data ownership.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text (UUID) | PK | Unique identifier |
| name | text | NOT NULL | Display name |
| email | text | UNIQUE, nullable | Optional, for future auth |
| geminiApiKey | text | encrypted, nullable | User's Gemini API key |
| preferences | JSON | NOT NULL, default {} | UI preferences (theme, timer defaults, etc.) |
| currentStreak | integer | NOT NULL, default 0 | Consecutive days with task completions |
| longestStreak | integer | NOT NULL, default 0 | All-time longest streak |
| lastActiveDate | text (ISO date) | nullable | Last day a task was completed |
| createdAt | text (ISO datetime) | NOT NULL | Account creation timestamp |
| updatedAt | text (ISO datetime) | NOT NULL | Last modification timestamp |

### BrainDump

A raw capture of unstructured user thoughts. The entry point of the
entire workflow.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text (UUID) | PK | Unique identifier |
| userId | text | FK → User.id, NOT NULL | Owner |
| rawText | text | NOT NULL, min 1 char | The unstructured dump content |
| status | text | NOT NULL, enum | Processing state: `raw`, `processing`, `organized`, `error` |
| aiSummary | text | nullable | AI-generated organized summary after processing |
| themes | JSON | nullable | Array of identified themes/categories |
| createdAt | text (ISO datetime) | NOT NULL | Capture timestamp |
| updatedAt | text (ISO datetime) | NOT NULL | Last modification timestamp |

**State transitions**:
```text
raw → processing → organized
               └→ error (retryable → processing)
```

**Validation rules**:
- rawText must contain at least 1 non-whitespace character
- status must be one of the defined enum values
- aiSummary is only set when status is `organized`

### Goal

A specific outcome extracted from a brain dump. Contains the "what"
(result) and "why" (purpose) from the RPM framework.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text (UUID) | PK | Unique identifier |
| userId | text | FK → User.id, NOT NULL | Owner |
| brainDumpId | text | FK → BrainDump.id, NOT NULL | Source brain dump |
| title | text | NOT NULL, max 200 chars | Concise goal name |
| purpose | text | NOT NULL | The emotional "why" — why this matters |
| description | text | nullable | Detailed description of desired outcome |
| status | text | NOT NULL, enum | State: `active`, `completed`, `archived` |
| progress | integer | NOT NULL, default 0 | Percentage complete (0-100) |
| sortOrder | integer | NOT NULL, default 0 | Display order among user's goals |
| completedAt | text (ISO datetime) | nullable | When goal was completed |
| createdAt | text (ISO datetime) | NOT NULL | Creation timestamp |
| updatedAt | text (ISO datetime) | NOT NULL | Last modification timestamp |

**State transitions**:
```text
active → completed
active → archived
archived → active (reactivate)
```

**Validation rules**:
- title must be 1-200 characters
- purpose must not be empty
- progress must be 0-100
- completedAt set only when status is `completed`

### Task

A specific, actionable step toward completing a goal. Sized for a
single focused session (25-90 minutes).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text (UUID) | PK | Unique identifier |
| goalId | text | FK → Goal.id, NOT NULL | Parent goal |
| title | text | NOT NULL, max 200 chars | Concise task name |
| description | text | nullable | Detailed description |
| doneDefinition | text | NOT NULL | Clear "done" criteria |
| estimatedMinutes | integer | NOT NULL, 5-120 | Estimated duration in minutes |
| status | text | NOT NULL, enum | State: `pending`, `in_progress`, `completed`, `skipped` |
| sortOrder | integer | NOT NULL | Execution sequence within the goal |
| dependsOn | JSON | nullable | Array of Task IDs that must complete first |
| completedAt | text (ISO datetime) | nullable | When task was completed |
| createdAt | text (ISO datetime) | NOT NULL | Creation timestamp |
| updatedAt | text (ISO datetime) | NOT NULL | Last modification timestamp |

**State transitions**:
```text
pending → in_progress → completed
pending → skipped
in_progress → pending (pause)
```

**Validation rules**:
- title must be 1-200 characters
- doneDefinition must not be empty
- estimatedMinutes must be between 5 and 120
- sortOrder must be unique within a goal
- completedAt set only when status is `completed`
- Tasks in `pending` cannot start if dependsOn tasks are not `completed`

### Clarification

A question-answer pair from the AI clarification process.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text (UUID) | PK | Unique identifier |
| brainDumpId | text | FK → BrainDump.id, NOT NULL | Source brain dump |
| question | text | NOT NULL | The clarification question |
| suggestedAnswers | JSON | nullable | Array of suggested answer options |
| userAnswer | text | nullable | The user's response |
| status | text | NOT NULL, enum | State: `pending`, `answered`, `skipped` |
| sortOrder | integer | NOT NULL | Question sequence (1-5) |
| createdAt | text (ISO datetime) | NOT NULL | Creation timestamp |
| updatedAt | text (ISO datetime) | NOT NULL | Last modification timestamp |

**Validation rules**:
- sortOrder must be 1-5 (max 5 clarification questions per dump)
- userAnswer is set only when status is `answered`
- suggestedAnswers is an array of strings

### ProgressRecord

A daily snapshot of user activity for streak tracking and
reinforcement triggers.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text (UUID) | PK | Unique identifier |
| userId | text | FK → User.id, NOT NULL | Owner |
| date | text (ISO date) | NOT NULL | The calendar date (YYYY-MM-DD) |
| tasksCompleted | integer | NOT NULL, default 0 | Tasks completed on this date |
| goalsAdvanced | integer | NOT NULL, default 0 | Distinct goals that had task completions |
| focusMinutes | integer | NOT NULL, default 0 | Total time spent in focus mode |
| createdAt | text (ISO datetime) | NOT NULL | Creation timestamp |
| updatedAt | text (ISO datetime) | NOT NULL | Last modification timestamp |

**Constraints**:
- UNIQUE(userId, date) — one record per user per day
- tasksCompleted, goalsAdvanced, focusMinutes must be >= 0

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| BrainDump | idx_braindump_user | userId, createdAt DESC | List user's dumps chronologically |
| Goal | idx_goal_user_status | userId, status | Filter active/archived goals |
| Goal | idx_goal_braindump | brainDumpId | Find goals from a brain dump |
| Task | idx_task_goal_order | goalId, sortOrder | Ordered task list for a goal |
| Task | idx_task_status | status | Find pending/in-progress tasks |
| Clarification | idx_clarification_dump | brainDumpId, sortOrder | Ordered questions for a dump |
| ProgressRecord | idx_progress_user_date | userId, date DESC | Streak calculation and history |

## Computed Values

These values are derived at query time, not stored:

- **Goal.progress**: `(completed tasks / total tasks) * 100` for the goal
- **User.currentStreak**: Count consecutive days backward from today in ProgressRecord where tasksCompleted > 0
- **Milestone triggers**: Check if goal progress crossed 25/50/75/100% threshold after task completion
