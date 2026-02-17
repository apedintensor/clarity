import { z } from "zod";
import { eq, and, count, sql, isNull, asc, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";

export const inboxRouter = router({
  create: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      title: z.string().trim().min(1).max(500),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const id = uuidv4();
      await ctx.db.insert(schema.inboxItems).values({
        id,
        userId: input.userId,
        title: input.title,
        description: input.description ?? null,
        status: "unprocessed",
        createdAt: now,
        updatedAt: now,
      });
      return { id, title: input.title, description: input.description ?? null, status: "unprocessed" as const, createdAt: now };
    }),

  list: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      status: z.enum(["unprocessed", "assigned", "deleted"]).default("unprocessed"),
    }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db
        .select()
        .from(schema.inboxItems)
        .where(and(
          eq(schema.inboxItems.userId, input.userId),
          eq(schema.inboxItems.status, input.status),
          isNull(schema.inboxItems.deletedAt),
        ))
        .orderBy(asc(schema.inboxItems.sortOrder), desc(schema.inboxItems.createdAt));
      return items;
    }),

  count: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ value: count() })
        .from(schema.inboxItems)
        .where(and(
          eq(schema.inboxItems.userId, input.userId),
          eq(schema.inboxItems.status, "unprocessed"),
          isNull(schema.inboxItems.deletedAt),
        ));
      return { count: result[0]?.value ?? 0 };
    }),

  assignToGoal: publicProcedure
    .input(z.object({
      inboxItemId: z.string().uuid(),
      goalId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.inboxItems.findFirst({
        where: eq(schema.inboxItems.id, input.inboxItemId),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });
      if (item.status !== "unprocessed") throw new TRPCError({ code: "BAD_REQUEST", message: "Item already processed" });

      // Get max sort order for the goal
      const maxOrder = await ctx.db
        .select({ max: sql<number>`coalesce(max(${schema.tasks.sortOrder}), -1)` })
        .from(schema.tasks)
        .where(eq(schema.tasks.goalId, input.goalId));

      const now = new Date().toISOString();
      const taskId = uuidv4();

      // Create a task from the inbox item
      await ctx.db.insert(schema.tasks).values({
        id: taskId,
        goalId: input.goalId,
        title: item.title,
        description: item.description,
        doneDefinition: item.title,
        estimatedMinutes: 30,
        status: "pending",
        sortOrder: (maxOrder[0]?.max ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      });

      // Update inbox item
      await ctx.db
        .update(schema.inboxItems)
        .set({
          status: "assigned",
          assignedGoalId: input.goalId,
          assignedTaskId: taskId,
          updatedAt: now,
        })
        .where(eq(schema.inboxItems.id, input.inboxItemId));

      return { inboxItemId: input.inboxItemId, createdTaskId: taskId, goalId: input.goalId };
    }),

  process: publicProcedure
    .input(z.object({ inboxItemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.inboxItems.findFirst({
        where: eq(schema.inboxItems.id, input.inboxItemId),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });
      if (item.status !== "unprocessed") throw new TRPCError({ code: "BAD_REQUEST", message: "Item already processed" });

      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No user found" });

      // Create a brain dump from the inbox item
      const now = new Date().toISOString();
      const brainDumpId = uuidv4();
      const rawText = item.description
        ? `${item.title}\n\n${item.description}`
        : item.title;

      await ctx.db.insert(schema.brainDumps).values({
        id: brainDumpId,
        userId: user.id,
        rawText,
        status: "raw",
        aiSummary: null,
        themes: null,
        createdAt: now,
        updatedAt: now,
      });

      // Mark inbox item as assigned (processed)
      await ctx.db
        .update(schema.inboxItems)
        .set({ status: "assigned", updatedAt: now })
        .where(eq(schema.inboxItems.id, input.inboxItemId));

      return { brainDumpId };
    }),

  reorder: publicProcedure
    .input(z.object({
      itemIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      for (let i = 0; i < input.itemIds.length; i++) {
        const id = input.itemIds[i]!;
        await ctx.db
          .update(schema.inboxItems)
          .set({ sortOrder: i, updatedAt: now })
          .where(eq(schema.inboxItems.id, id));
      }
      return { success: true as const };
    }),

  softDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(schema.inboxItems)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.inboxItems.id, input.id));
      return { id: input.id, deletedAt: now };
    }),

  undoDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(schema.inboxItems)
        .set({ deletedAt: null, updatedAt: now })
        .where(eq(schema.inboxItems.id, input.id));
      return { success: true as const };
    }),

  acceptSuggestion: publicProcedure
    .input(z.object({
      suggestion: z.object({
        title: z.string().min(1),
        purpose: z.string().min(1),
        tasks: z.array(z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          estimatedMinutes: z.number().min(5).max(120).default(30),
        })),
      }),
      inboxItemId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No user found" });

      // Create a brain dump entry as anchor for the goal
      const now = new Date().toISOString();
      const brainDumpId = uuidv4();
      await ctx.db.insert(schema.brainDumps).values({
        id: brainDumpId,
        userId: user.id,
        rawText: `${input.suggestion.title}: ${input.suggestion.purpose}`,
        status: "organized",
        aiSummary: input.suggestion.purpose,
        themes: null,
        createdAt: now,
        updatedAt: now,
      });

      // Calculate colorIndex
      const goalCountResult = await ctx.db
        .select({ value: count() })
        .from(schema.goals)
        .where(eq(schema.goals.userId, user.id));
      const colorIndex = (goalCountResult[0]?.value ?? 0) % 10;

      // Create goal
      const goalId = uuidv4();
      await ctx.db.insert(schema.goals).values({
        id: goalId,
        userId: user.id,
        brainDumpId,
        title: input.suggestion.title,
        purpose: input.suggestion.purpose,
        description: null,
        status: "active",
        progress: 0,
        sortOrder: 0,
        colorIndex,
        completedAt: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      // Create tasks
      const taskIds: string[] = [];
      for (let i = 0; i < input.suggestion.tasks.length; i++) {
        const t = input.suggestion.tasks[i]!;
        const taskId = uuidv4();
        await ctx.db.insert(schema.tasks).values({
          id: taskId,
          goalId,
          title: t.title,
          description: t.description ?? null,
          doneDefinition: t.title,
          estimatedMinutes: t.estimatedMinutes,
          status: "pending",
          sortOrder: i,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        taskIds.push(taskId);
      }

      // Optionally soft-delete the inbox item
      if (input.inboxItemId) {
        await ctx.db
          .update(schema.inboxItems)
          .set({ deletedAt: now, updatedAt: now })
          .where(eq(schema.inboxItems.id, input.inboxItemId));
      }

      return { goalId, taskIds };
    }),

  convertToGoal: publicProcedure
    .input(z.object({ inboxItemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.inboxItems.findFirst({
        where: eq(schema.inboxItems.id, input.inboxItemId),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });

      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No user found" });

      const now = new Date().toISOString();

      // Create brain dump anchor
      const brainDumpId = uuidv4();
      await ctx.db.insert(schema.brainDumps).values({
        id: brainDumpId,
        userId: user.id,
        rawText: item.description ? `${item.title}\n\n${item.description}` : item.title,
        status: "organized",
        aiSummary: null,
        themes: null,
        createdAt: now,
        updatedAt: now,
      });

      // Calculate colorIndex
      const goalCountResult = await ctx.db
        .select({ value: count() })
        .from(schema.goals)
        .where(eq(schema.goals.userId, user.id));
      const colorIndex = (goalCountResult[0]?.value ?? 0) % 10;

      const goalId = uuidv4();
      await ctx.db.insert(schema.goals).values({
        id: goalId,
        userId: user.id,
        brainDumpId,
        title: item.title,
        purpose: item.title,
        description: item.description ?? null,
        status: "active",
        progress: 0,
        sortOrder: 0,
        colorIndex,
        completedAt: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      // Soft-delete inbox item
      await ctx.db
        .update(schema.inboxItems)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.inboxItems.id, input.inboxItemId));

      return { goalId };
    }),

  convertToTask: publicProcedure
    .input(z.object({
      inboxItemId: z.string().uuid(),
      goalId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.inboxItems.findFirst({
        where: eq(schema.inboxItems.id, input.inboxItemId),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });

      // Get max sort order for the goal
      const maxOrder = await ctx.db
        .select({ max: sql<number>`coalesce(max(${schema.tasks.sortOrder}), -1)` })
        .from(schema.tasks)
        .where(eq(schema.tasks.goalId, input.goalId));

      const now = new Date().toISOString();
      const taskId = uuidv4();

      await ctx.db.insert(schema.tasks).values({
        id: taskId,
        goalId: input.goalId,
        title: item.title,
        description: item.description,
        doneDefinition: item.title,
        estimatedMinutes: 30,
        status: "pending",
        sortOrder: (maxOrder[0]?.max ?? -1) + 1,
        createdAt: now,
        updatedAt: now,
      });

      // Soft-delete inbox item
      await ctx.db
        .update(schema.inboxItems)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.inboxItems.id, input.inboxItemId));

      return { taskId };
    }),

  convertToSubtask: publicProcedure
    .input(z.object({
      inboxItemId: z.string().uuid(),
      taskId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.inboxItems.findFirst({
        where: eq(schema.inboxItems.id, input.inboxItemId),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Inbox item not found" });

      const parentTask = await ctx.db.query.tasks.findFirst({
        where: eq(schema.tasks.id, input.taskId),
      });
      if (!parentTask) throw new TRPCError({ code: "NOT_FOUND", message: "Parent task not found" });

      // Get max sort order for the goal
      const maxOrder = await ctx.db
        .select({ max: sql<number>`coalesce(max(${schema.tasks.sortOrder}), -1)` })
        .from(schema.tasks)
        .where(eq(schema.tasks.goalId, parentTask.goalId));

      const now = new Date().toISOString();
      const subtaskId = uuidv4();

      await ctx.db.insert(schema.tasks).values({
        id: subtaskId,
        goalId: parentTask.goalId,
        title: item.title,
        description: item.description,
        doneDefinition: item.title,
        estimatedMinutes: 30,
        status: "pending",
        sortOrder: (maxOrder[0]?.max ?? -1) + 1,
        parentTaskId: input.taskId,
        createdAt: now,
        updatedAt: now,
      });

      // Soft-delete inbox item
      await ctx.db
        .update(schema.inboxItems)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.inboxItems.id, input.inboxItemId));

      return { subtaskId };
    }),

  delete: publicProcedure
    .input(z.object({ inboxItemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.inboxItems)
        .set({ status: "deleted", updatedAt: new Date().toISOString() })
        .where(eq(schema.inboxItems.id, input.inboxItemId));
      return { success: true as const };
    }),
});
