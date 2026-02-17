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
    colorIndex: integer("color_index").notNull().default(0),
    deletedAt: text("deleted_at"),
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
    parentTaskId: text("parent_task_id"),
    completedAt: text("completed_at"),
    scheduledDate: text("scheduled_date"),
    scheduledStart: text("scheduled_start"),
    scheduledDuration: integer("scheduled_duration").default(30),
    deletedAt: text("deleted_at"),
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

export const inboxItems = sqliteTable(
  "inbox_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ["unprocessed", "assigned", "deleted"] }).notNull().default("unprocessed"),
    assignedGoalId: text("assigned_goal_id").references(() => goals.id),
    assignedTaskId: text("assigned_task_id").references(() => tasks.id),
    sortOrder: integer("sort_order").notNull().default(0),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_inbox_user_status").on(table.userId, table.status),
    index("idx_inbox_created").on(table.createdAt),
  ],
);

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    inboxItemId: text("inbox_item_id").notNull().references(() => inboxItems.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_conversation_inbox_item").on(table.inboxItemId),
  ],
);

export const conversationMessages = sqliteTable(
  "conversation_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id").notNull().references(() => conversations.id),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_conv_msg_conversation").on(table.conversationId),
  ],
);

export const dailyPlans = sqliteTable(
  "daily_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    date: text("date").notNull(),
    selectedTaskIds: text("selected_task_ids", { mode: "json" }).notNull().$type<string[]>().default([]),
    totalEstimatedMinutes: integer("total_estimated_minutes").notNull().default(0),
    focusThresholdMinutes: integer("focus_threshold_minutes").notNull().default(360),
    isOvercommitted: integer("is_overcommitted").notNull().default(0),
    status: text("status", { enum: ["in_progress", "confirmed", "skipped"] }).notNull().default("in_progress"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_daily_plan_user_date").on(table.userId, table.date),
  ],
);
