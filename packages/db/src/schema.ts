import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  geminiApiKey: text("gemini_api_key"),
  preferences: text("preferences", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const brainDumps = sqliteTable(
  "brain_dumps",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    rawText: text("raw_text").notNull(),
    status: text("status", { enum: ["raw", "processing", "organized", "error"] }).notNull().default("raw"),
    aiSummary: text("ai_summary"),
    themes: text("themes", { mode: "json" }).$type<string[]>(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_braindump_user").on(table.userId, table.createdAt),
  ],
);

export const goals = sqliteTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    brainDumpId: text("brain_dump_id").notNull().references(() => brainDumps.id),
    title: text("title").notNull(),
    purpose: text("purpose").notNull(),
    description: text("description"),
    status: text("status", { enum: ["active", "completed", "archived"] }).notNull().default("active"),
    progress: integer("progress").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_goal_user_status").on(table.userId, table.status),
    index("idx_goal_braindump").on(table.brainDumpId),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id").notNull().references(() => goals.id),
    title: text("title").notNull(),
    description: text("description"),
    doneDefinition: text("done_definition").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    status: text("status", { enum: ["pending", "in_progress", "completed", "skipped"] }).notNull().default("pending"),
    sortOrder: integer("sort_order").notNull(),
    dependsOn: text("depends_on", { mode: "json" }).$type<string[]>(),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_task_goal_order").on(table.goalId, table.sortOrder),
    index("idx_task_status").on(table.status),
  ],
);

export const clarifications = sqliteTable(
  "clarifications",
  {
    id: text("id").primaryKey(),
    brainDumpId: text("brain_dump_id").notNull().references(() => brainDumps.id),
    question: text("question").notNull(),
    suggestedAnswers: text("suggested_answers", { mode: "json" }).$type<string[]>(),
    userAnswer: text("user_answer"),
    status: text("status", { enum: ["pending", "answered", "skipped"] }).notNull().default("pending"),
    sortOrder: integer("sort_order").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_clarification_dump").on(table.brainDumpId, table.sortOrder),
  ],
);

export const progressRecords = sqliteTable(
  "progress_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    date: text("date").notNull(),
    tasksCompleted: integer("tasks_completed").notNull().default(0),
    goalsAdvanced: integer("goals_advanced").notNull().default(0),
    focusMinutes: integer("focus_minutes").notNull().default(0),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_progress_user_date").on(table.userId, table.date),
  ],
);
