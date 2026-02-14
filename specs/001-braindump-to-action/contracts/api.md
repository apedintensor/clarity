# API Contracts: Braindump to Action

**Branch**: `001-braindump-to-action` | **Date**: 2026-02-14
**Protocol**: tRPC (type-safe RPC over HTTP)

All procedures are type-safe via tRPC — input/output types are
inferred from Zod schemas. This document describes the logical
contract; actual TypeScript types are generated from the router.

## Brain Dump Procedures

### `braindump.create`

**Type**: Mutation
**Purpose**: Capture a new brain dump

**Input**:
```
{
  rawText: string (min 1 char, required)
}
```

**Output**:
```
{
  id: string (UUID)
  rawText: string
  status: "raw"
  createdAt: string (ISO datetime)
}
```

**Errors**:
- `BAD_REQUEST`: rawText is empty or whitespace-only

---

### `braindump.list`

**Type**: Query
**Purpose**: List all brain dumps for the user

**Input**:
```
{
  limit?: number (default 20, max 100)
  cursor?: string (UUID, for pagination)
}
```

**Output**:
```
{
  items: BrainDump[]
  nextCursor?: string
}
```

---

### `braindump.get`

**Type**: Query
**Purpose**: Get a single brain dump with its clarifications and goals

**Input**:
```
{
  id: string (UUID, required)
}
```

**Output**:
```
{
  ...BrainDump
  clarifications: Clarification[]
  goals: Goal[]
}
```

**Errors**:
- `NOT_FOUND`: Brain dump does not exist

---

### `braindump.process`

**Type**: Mutation (streaming via SSE)
**Purpose**: Trigger AI analysis of a brain dump. Streams organized
themes, goals, and clarification questions.

**Input**:
```
{
  id: string (UUID, required)
}
```

**Output** (streamed):
```
{
  themes: string[]
  suggestedGoals: { title: string, purpose: string }[]
  clarifications: { question: string, suggestedAnswers: string[] }[]
  summary: string
}
```

**Side effects**:
- Sets braindump.status to `processing`, then `organized`
- Creates Clarification records
- On error, sets status to `error`

**Errors**:
- `NOT_FOUND`: Brain dump does not exist
- `PRECONDITION_FAILED`: Brain dump already processed
- `INTERNAL_SERVER_ERROR`: AI provider failure

---

### `braindump.update`

**Type**: Mutation
**Purpose**: Append text to an existing brain dump or edit AI summary

**Input**:
```
{
  id: string (UUID, required)
  appendText?: string
  aiSummary?: string
}
```

**Output**:
```
{
  ...BrainDump (updated)
}
```

---

## Clarification Procedures

### `clarification.answer`

**Type**: Mutation
**Purpose**: Submit an answer to a clarification question

**Input**:
```
{
  id: string (UUID, required)
  answer: string (required, min 1 char)
}
```

**Output**:
```
{
  ...Clarification (updated, status: "answered")
}
```

---

### `clarification.skip`

**Type**: Mutation
**Purpose**: Skip a clarification question

**Input**:
```
{
  id: string (UUID, required)
}
```

**Output**:
```
{
  ...Clarification (updated, status: "skipped")
}
```

---

### `clarification.answerAll`

**Type**: Mutation
**Purpose**: Submit answers to multiple clarification questions at once

**Input**:
```
{
  answers: { id: string, answer: string }[]
}
```

**Output**:
```
{
  clarifications: Clarification[]
  braindump: BrainDump (with refined summary)
}
```

**Side effects**:
- Triggers AI re-analysis with clarification context
- Updates braindump.aiSummary with refined summary

---

## Goal Procedures

### `goal.create`

**Type**: Mutation
**Purpose**: Create a goal from AI suggestion or manually

**Input**:
```
{
  brainDumpId: string (UUID, required)
  title: string (1-200 chars, required)
  purpose: string (required)
  description?: string
}
```

**Output**:
```
{
  ...Goal (status: "active", progress: 0)
}
```

---

### `goal.list`

**Type**: Query
**Purpose**: List user's goals with progress

**Input**:
```
{
  status?: "active" | "completed" | "archived"
}
```

**Output**:
```
{
  items: (Goal & { taskCount: number, completedTaskCount: number })[]
}
```

---

### `goal.get`

**Type**: Query
**Purpose**: Get a goal with its tasks

**Input**:
```
{
  id: string (UUID, required)
}
```

**Output**:
```
{
  ...Goal
  tasks: Task[]
}
```

---

### `goal.breakdown`

**Type**: Mutation (streaming via SSE)
**Purpose**: AI-powered task decomposition for a goal

**Input**:
```
{
  id: string (UUID, required)
}
```

**Output** (streamed):
```
{
  tasks: {
    title: string
    description: string
    doneDefinition: string
    estimatedMinutes: number
    sortOrder: number
    dependsOn: string[]
  }[]
}
```

**Side effects**:
- Creates Task records for the goal
- Large tasks (>90 min estimated) are auto-split

**Errors**:
- `NOT_FOUND`: Goal does not exist
- `PRECONDITION_FAILED`: Goal already has tasks (use goal.rebreakdown)

---

### `goal.update`

**Type**: Mutation
**Purpose**: Update goal details or status

**Input**:
```
{
  id: string (UUID, required)
  title?: string
  purpose?: string
  description?: string
  status?: "active" | "completed" | "archived"
  sortOrder?: number
}
```

**Output**:
```
{
  ...Goal (updated)
}
```

---

## Task Procedures

### `task.list`

**Type**: Query
**Purpose**: List tasks for a goal in execution order

**Input**:
```
{
  goalId: string (UUID, required)
}
```

**Output**:
```
{
  items: Task[]
}
```

---

### `task.update`

**Type**: Mutation
**Purpose**: Update task details or status

**Input**:
```
{
  id: string (UUID, required)
  title?: string
  description?: string
  doneDefinition?: string
  estimatedMinutes?: number
  status?: "pending" | "in_progress" | "completed" | "skipped"
  sortOrder?: number
}
```

**Output**:
```
{
  task: Task (updated)
  goalProgress: number (updated percentage)
  milestone?: "25" | "50" | "75" | "100" (if threshold crossed)
  reinforcement: {
    message: string
    type: "completion" | "milestone" | "streak"
  }
}
```

**Side effects**:
- Recalculates Goal.progress
- Updates ProgressRecord for today
- Updates User streak if first completion today
- Returns milestone info if threshold crossed

---

### `task.getNext`

**Type**: Query
**Purpose**: Get the next actionable task for a goal (focus mode)

**Input**:
```
{
  goalId: string (UUID, required)
}
```

**Output**:
```
{
  task: Task | null
  position: number (e.g., "3 of 12")
  totalTasks: number
  goalProgress: number
}
```

**Logic**: Returns the first task with status `pending` whose
dependencies are all `completed`, ordered by sortOrder.

---

### `task.complete`

**Type**: Mutation
**Purpose**: Mark current task complete and return next task (focus mode flow)

**Input**:
```
{
  id: string (UUID, required)
}
```

**Output**:
```
{
  completedTask: Task
  nextTask: Task | null
  goalProgress: number
  milestone?: "25" | "50" | "75" | "100"
  reinforcement: {
    message: string
    type: "completion" | "milestone" | "streak"
  }
  streak: {
    current: number
    longest: number
    isNewRecord: boolean
  }
}
```

**Side effects**:
- Sets task status to `completed`, completedAt to now
- Recalculates goal progress
- Updates daily ProgressRecord
- Updates user streak
- Selects varied reinforcement message

---

## Progress Procedures

### `progress.dashboard`

**Type**: Query
**Purpose**: Get dashboard overview data

**Input**: none

**Output**:
```
{
  activeGoals: (Goal & { taskCount: number, completedCount: number })[]
  streak: { current: number, longest: number }
  today: { tasksCompleted: number, focusMinutes: number }
  recentCompletions: Task[] (last 10)
  weeklyActivity: ProgressRecord[] (last 7 days)
}
```

---

### `progress.history`

**Type**: Query
**Purpose**: Get historical progress data

**Input**:
```
{
  days?: number (default 30, max 365)
}
```

**Output**:
```
{
  records: ProgressRecord[]
  totalTasksCompleted: number
  totalGoalsCompleted: number
  totalFocusMinutes: number
  averageTasksPerDay: number
}
```

---

## Reinforcement Procedures

### `reinforcement.getMessage`

**Type**: Query
**Purpose**: Get a varied positive reinforcement message

**Input**:
```
{
  type: "completion" | "milestone" | "streak" | "return"
  context?: {
    taskTitle?: string
    goalTitle?: string
    progress?: number
    streakCount?: number
  }
}
```

**Output**:
```
{
  message: string
  emoji?: string
}
```

**Logic**: Uses a pool of messages per type with variable selection
to avoid repetition. Tracks recently used messages per user.

---

## User Procedures

### `user.getOrCreate`

**Type**: Query
**Purpose**: Get current user or create default user (single-user app)

**Input**: none

**Output**:
```
{
  ...User
}
```

**Logic**: Returns the single user record. Creates one with defaults
if none exists. No authentication required for local-only app.

---

### `user.updatePreferences`

**Type**: Mutation
**Purpose**: Update user preferences

**Input**:
```
{
  preferences: {
    theme?: "light" | "dark" | "system"
    defaultTimerMinutes?: number
    celebrationStyle?: "minimal" | "standard" | "enthusiastic"
  }
}
```

**Output**:
```
{
  ...User (updated)
}
```

---

## CLI Command Mapping

| CLI Command | tRPC Procedure | Notes |
|-------------|---------------|-------|
| `clarity dump <text>` | braindump.create | Also accepts stdin pipe |
| `clarity dumps` | braindump.list | --limit, --json flags |
| `clarity process <id>` | braindump.process | Interactive clarification |
| `clarity clarify <id>` | clarification.answerAll | Answer via prompts |
| `clarity goals` | goal.list | --status flag |
| `clarity goal <id>` | goal.get | Shows tasks |
| `clarity breakdown <goalId>` | goal.breakdown | AI task decomposition |
| `clarity tasks <goalId>` | task.list | --json flag |
| `clarity focus <goalId>` | task.getNext + task.complete | Interactive loop |
| `clarity done <taskId>` | task.complete | Quick complete |
| `clarity progress` | progress.dashboard | Summary view |
| `clarity history` | progress.history | --days flag |

All CLI commands support `--json` flag for machine-readable output.
