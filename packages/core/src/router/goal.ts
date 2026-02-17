import { z } from "zod";
import { eq, and, count, sql, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";
import { decomposeGoalIntoTasks } from "../ai/task-decomposer";

export const goalRouter = router({
  create: publicProcedure
    .input(
      z.object({
        brainDumpId: z.string().uuid(),
        title: z.string().trim().min(1).max(200),
        purpose: z.string().trim().min(1),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No user found" });

      const dump = await ctx.db.query.brainDumps.findFirst({
        where: eq(schema.brainDumps.id, input.brainDumpId),
      });
      if (!dump) throw new TRPCError({ code: "NOT_FOUND", message: "Brain dump not found" });

      const existingGoals = await ctx.db
        .select({ count: count() })
        .from(schema.goals)
        .where(eq(schema.goals.brainDumpId, input.brainDumpId));

      // Calculate colorIndex based on total goals for user
      const totalGoals = await ctx.db
        .select({ count: count() })
        .from(schema.goals)
        .where(eq(schema.goals.userId, user.id));
      const colorIndex = (totalGoals[0]?.count ?? 0) % 10;

      const sortOrder = (existingGoals[0]?.count ?? 0);
      const now = new Date().toISOString();

      const goal = {
        id: uuidv4(),
        userId: user.id,
        brainDumpId: input.brainDumpId,
        title: input.title,
        purpose: input.purpose,
        description: input.description ?? null,
        status: "active" as const,
        progress: 0,
        sortOrder,
        colorIndex,
        completedAt: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await ctx.db.insert(schema.goals).values(goal);
      return goal;
    }),

  list: publicProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      status: z.enum(["active", "completed", "archived"]).optional(),
    }).default({}))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) return { items: [] };

      const conditions = [
        eq(schema.goals.userId, user.id),
        isNull(schema.goals.deletedAt),
      ];
      if (input.status) {
        conditions.push(eq(schema.goals.status, input.status));
      }

      const goalsList = await ctx.db
        .select()
        .from(schema.goals)
        .where(and(...conditions))
        .orderBy(schema.goals.sortOrder);

      const items = await Promise.all(
        goalsList.map(async (goal) => {
          const taskCounts = await ctx.db
            .select({
              total: count(),
              completed: sql<number>`sum(case when ${schema.tasks.status} = 'completed' then 1 else 0 end)`,
            })
            .from(schema.tasks)
            .where(and(eq(schema.tasks.goalId, goal.id), isNull(schema.tasks.deletedAt)));

          const tasksList = await ctx.db
            .select()
            .from(schema.tasks)
            .where(and(eq(schema.tasks.goalId, goal.id), isNull(schema.tasks.deletedAt)))
            .orderBy(schema.tasks.sortOrder);

          return {
            ...goal,
            taskCount: taskCounts[0]?.total ?? 0,
            completedTaskCount: taskCounts[0]?.completed ?? 0,
            tasks: tasksList,
          };
        }),
      );

      return { items };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.db.query.goals.findFirst({
        where: and(eq(schema.goals.id, input.id), isNull(schema.goals.deletedAt)),
      });

      if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });

      const tasksList = await ctx.db
        .select()
        .from(schema.tasks)
        .where(and(eq(schema.tasks.goalId, goal.id), isNull(schema.tasks.deletedAt)))
        .orderBy(schema.tasks.sortOrder);

      return { ...goal, tasks: tasksList };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(200).optional(),
        purpose: z.string().trim().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["active", "completed", "archived"]).optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.query.goals.findFirst({
        where: eq(schema.goals.id, input.id),
      });

      if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = { updatedAt: now };

      if (input.title !== undefined) updates.title = input.title;
      if (input.purpose !== undefined) updates.purpose = input.purpose;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status !== undefined) {
        updates.status = input.status;
        if (input.status === "completed") updates.completedAt = now;
      }
      if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

      await ctx.db.update(schema.goals).set(updates).where(eq(schema.goals.id, input.id));

      return { ...goal, ...updates };
    }),

  reorder: publicProcedure
    .input(z.object({
      goalIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      for (let i = 0; i < input.goalIds.length; i++) {
        const id = input.goalIds[i]!;
        await ctx.db
          .update(schema.goals)
          .set({ sortOrder: i, updatedAt: now })
          .where(eq(schema.goals.id, id));
      }
      return { success: true as const };
    }),

  softDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.query.goals.findFirst({
        where: eq(schema.goals.id, input.id),
      });
      if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });

      const now = new Date().toISOString();

      // Soft-delete the goal
      await ctx.db
        .update(schema.goals)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(schema.goals.id, input.id));

      // Cascade soft-delete all tasks under this goal that aren't already deleted
      const tasksToDelete = await ctx.db
        .select({ id: schema.tasks.id })
        .from(schema.tasks)
        .where(and(eq(schema.tasks.goalId, input.id), isNull(schema.tasks.deletedAt)));

      const cascadeDeletedTaskIds = tasksToDelete.map((t) => t.id);

      if (cascadeDeletedTaskIds.length > 0) {
        for (const taskId of cascadeDeletedTaskIds) {
          await ctx.db
            .update(schema.tasks)
            .set({ deletedAt: now, updatedAt: now })
            .where(eq(schema.tasks.id, taskId));
        }
      }

      return { id: input.id, deletedAt: now, cascadeDeletedTaskIds };
    }),

  undoDelete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      cascadeDeletedTaskIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();

      // Restore the goal
      await ctx.db
        .update(schema.goals)
        .set({ deletedAt: null, updatedAt: now })
        .where(eq(schema.goals.id, input.id));

      // Restore cascade-deleted tasks
      for (const taskId of input.cascadeDeletedTaskIds) {
        await ctx.db
          .update(schema.tasks)
          .set({ deletedAt: null, updatedAt: now })
          .where(eq(schema.tasks.id, taskId));
      }

      return { success: true as const };
    }),

  permanentDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete all tasks under this goal
      await ctx.db
        .delete(schema.tasks)
        .where(eq(schema.tasks.goalId, input.id));

      // Delete the goal
      await ctx.db
        .delete(schema.goals)
        .where(eq(schema.goals.id, input.id));

      return { success: true as const };
    }),

  breakdown: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.db.query.goals.findFirst({
        where: eq(schema.goals.id, input.id),
      });

      if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found" });

      // Get the brain dump for context
      const dump = await ctx.db.query.brainDumps.findFirst({
        where: eq(schema.brainDumps.id, goal.brainDumpId),
      });

      const result = await decomposeGoalIntoTasks({
        title: goal.title,
        purpose: goal.purpose,
        description: goal.description,
        context: dump?.rawText,
      });

      // Create task records in the database
      const createdTasks: Array<{ id: string; goalId: string; title: string }> = [];
      for (let i = 0; i < result.tasks.length; i++) {
        const t = result.tasks[i]!;
        const task = {
          id: uuidv4(),
          goalId: goal.id,
          title: t.title,
          description: t.description,
          doneDefinition: t.doneDefinition,
          estimatedMinutes: t.estimatedMinutes,
          status: "pending" as const,
          sortOrder: i,
          dependsOn: t.dependsOn.length > 0
            ? t.dependsOn.map((idx) => createdTasks[idx]?.id).filter((id): id is string => id != null)
            : null,
          completedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await ctx.db.insert(schema.tasks).values(task);
        createdTasks.push(task);
      }

      return { tasks: createdTasks };
    }),
});
