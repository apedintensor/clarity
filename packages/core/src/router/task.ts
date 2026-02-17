import { z } from "zod";
import { eq, and, count, sql, isNull, gte, lte, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";
import { updateStreakForCompletion } from "../services/streak";
import { checkMilestone } from "../services/milestone";
import { getReinforcementMessage } from "../services/reinforcement";

export const taskRouter = router({
  list: publicProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db
        .select()
        .from(schema.tasks)
        .where(and(eq(schema.tasks.goalId, input.goalId), isNull(schema.tasks.deletedAt)))
        .orderBy(schema.tasks.sortOrder);

      return { items };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().optional(),
        doneDefinition: z.string().trim().min(1).optional(),
        estimatedMinutes: z.number().min(5).max(480).optional(),
        status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
        sortOrder: z.number().optional(),
        scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        scheduledStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
        scheduledDuration: z.number().min(5).max(480).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: eq(schema.tasks.id, input.id),
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = { updatedAt: now };

      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.doneDefinition !== undefined) updates.doneDefinition = input.doneDefinition;
      if (input.estimatedMinutes !== undefined) updates.estimatedMinutes = input.estimatedMinutes;
      if (input.status !== undefined) {
        updates.status = input.status;
        if (input.status === "completed") updates.completedAt = now;
      }
      if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
      if (input.scheduledDate !== undefined) updates.scheduledDate = input.scheduledDate;
      if (input.scheduledStart !== undefined) updates.scheduledStart = input.scheduledStart;
      if (input.scheduledDuration !== undefined) updates.scheduledDuration = input.scheduledDuration;

      await ctx.db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, input.id));

      const goalProgress = await recalculateGoalProgress(ctx.db, task.goalId);
      const milestone = checkMilestone(task.goalId, goalProgress);
      const reinforcement = getReinforcementMessage(
        input.status === "completed" ? (milestone ? "milestone" : "completion") : "completion",
        { progress: goalProgress },
      );

      return { task: { ...task, ...updates }, goalProgress, milestone, reinforcement };
    }),

  getNext: publicProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const allTasks = await ctx.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.goalId, input.goalId))
        .orderBy(schema.tasks.sortOrder);

      const completedIds = new Set(
        allTasks.filter((t) => t.status === "completed").map((t) => t.id),
      );

      const nextTask = allTasks.find((t) => {
        if (t.status !== "pending") return false;
        const deps = t.dependsOn ?? [];
        return deps.every((depId) => completedIds.has(depId));
      }) ?? null;

      const completedCount = allTasks.filter((t) => t.status === "completed").length;
      const totalTasks = allTasks.length;
      const goalProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      return {
        task: nextTask,
        position: completedCount + 1,
        totalTasks,
        goalProgress,
      };
    }),

  complete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: eq(schema.tasks.id, input.id),
      });

      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

      const now = new Date().toISOString();
      await ctx.db
        .update(schema.tasks)
        .set({ status: "completed", completedAt: now, updatedAt: now })
        .where(eq(schema.tasks.id, input.id));

      const completedTask = { ...task, status: "completed" as const, completedAt: now, updatedAt: now };

      const goalProgress = await recalculateGoalProgress(ctx.db, task.goalId);

      // Update goal progress in DB
      await ctx.db
        .update(schema.goals)
        .set({ progress: goalProgress, updatedAt: now })
        .where(eq(schema.goals.id, task.goalId));

      // If 100%, mark goal completed
      if (goalProgress === 100) {
        await ctx.db
          .update(schema.goals)
          .set({ status: "completed", completedAt: now, updatedAt: now })
          .where(eq(schema.goals.id, task.goalId));
      }

      const milestone = checkMilestone(task.goalId, goalProgress);
      const streak = await updateStreakForCompletion(ctx.db);
      const reinforcement = getReinforcementMessage(
        milestone ? "milestone" : streak.isNewRecord ? "streak" : "completion",
        { progress: goalProgress, streakCount: streak.current },
      );

      // Get next task
      const allTasks = await ctx.db
        .select()
        .from(schema.tasks)
        .where(eq(schema.tasks.goalId, task.goalId))
        .orderBy(schema.tasks.sortOrder);

      const completedIds = new Set(allTasks.filter((t) => t.status === "completed").map((t) => t.id));
      const nextTask = allTasks.find((t) => {
        if (t.status !== "pending") return false;
        const deps = t.dependsOn ?? [];
        return deps.every((depId) => completedIds.has(depId));
      }) ?? null;

      // Update progress record
      const today = new Date().toISOString().split("T")[0]!;
      const user = await ctx.db.query.users.findFirst();
      if (user) {
        const existing = await ctx.db.query.progressRecords.findFirst({
          where: and(
            eq(schema.progressRecords.userId, user.id),
            eq(schema.progressRecords.date, today),
          ),
        });

        if (existing) {
          await ctx.db
            .update(schema.progressRecords)
            .set({
              tasksCompleted: existing.tasksCompleted + 1,
              goalsAdvanced: existing.goalsAdvanced + (goalProgress > 0 ? 1 : 0),
              updatedAt: now,
            })
            .where(eq(schema.progressRecords.id, existing.id));
        } else {
          await ctx.db.insert(schema.progressRecords).values({
            id: uuidv4(),
            userId: user.id,
            date: today,
            tasksCompleted: 1,
            goalsAdvanced: 1,
            focusMinutes: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      return { completedTask, nextTask, goalProgress, milestone, reinforcement, streak };
    }),

  reorder: publicProcedure
    .input(z.object({
      goalId: z.string().uuid(),
      taskIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      for (let i = 0; i < input.taskIds.length; i++) {
        const taskId = input.taskIds[i]!;
        await ctx.db
          .update(schema.tasks)
          .set({ sortOrder: i, updatedAt: now })
          .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.goalId, input.goalId)));
      }
      return { success: true as const };
    }),

  softDelete: publicProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: eq(schema.tasks.id, input.taskId),
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

      const now = new Date().toISOString();

      // Soft-delete the task
      await ctx.db
        .update(schema.tasks)
        .set({ deletedAt: now, scheduledDate: null, scheduledStart: null, scheduledDuration: null, updatedAt: now })
        .where(eq(schema.tasks.id, input.taskId));

      // Soft-delete subtasks (tasks that depend on this one — simplified: tasks with dependsOn containing this id)
      const allGoalTasks = await ctx.db
        .select()
        .from(schema.tasks)
        .where(and(eq(schema.tasks.goalId, task.goalId), isNull(schema.tasks.deletedAt)));

      let subtaskCount = 0;
      for (const t of allGoalTasks) {
        const deps = t.dependsOn ?? [];
        if (deps.includes(input.taskId)) {
          await ctx.db
            .update(schema.tasks)
            .set({ deletedAt: now, scheduledDate: null, scheduledStart: null, scheduledDuration: null, updatedAt: now })
            .where(eq(schema.tasks.id, t.id));
          subtaskCount++;
        }
      }

      // Recalculate goal progress
      const goalProgress = await recalculateGoalProgress(ctx.db, task.goalId);
      await ctx.db
        .update(schema.goals)
        .set({ progress: goalProgress, updatedAt: now })
        .where(eq(schema.goals.id, task.goalId));

      return {
        id: task.id,
        deletedAt: now,
        hadSubtasks: subtaskCount > 0,
        subtaskCount,
      };
    }),

  undoDelete: publicProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: eq(schema.tasks.id, input.taskId),
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      if (!task.deletedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Task is not deleted" });

      const deletedTime = new Date(task.deletedAt).getTime();
      const elapsed = Date.now() - deletedTime;
      if (elapsed > 30000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Undo window has expired" });
      }

      const now = new Date().toISOString();

      // Restore this task
      await ctx.db
        .update(schema.tasks)
        .set({ deletedAt: null, updatedAt: now })
        .where(eq(schema.tasks.id, input.taskId));

      // Restore subtasks deleted at the same time
      const allDeleted = await ctx.db
        .select()
        .from(schema.tasks)
        .where(and(eq(schema.tasks.goalId, task.goalId), eq(schema.tasks.deletedAt, task.deletedAt)));

      for (const t of allDeleted) {
        await ctx.db
          .update(schema.tasks)
          .set({ deletedAt: null, updatedAt: now })
          .where(eq(schema.tasks.id, t.id));
      }

      const goalProgress = await recalculateGoalProgress(ctx.db, task.goalId);
      await ctx.db
        .update(schema.goals)
        .set({ progress: goalProgress, updatedAt: now })
        .where(eq(schema.goals.id, task.goalId));

      return { success: true as const, restoredCount: allDeleted.length + 1 };
    }),

  permanentDelete: publicProcedure
    .input(z.object({ olderThanSeconds: z.number().default(30) }))
    .mutation(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.olderThanSeconds * 1000).toISOString();
      const deleted = await ctx.db
        .delete(schema.tasks)
        .where(and(
          sql`${schema.tasks.deletedAt} IS NOT NULL`,
          lt(schema.tasks.deletedAt, cutoff),
        ));
      return { deletedCount: deleted.changes };
    }),

  schedule: publicProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      scheduledStart: z.string().regex(/^\d{2}:\d{2}$/),
      scheduledDuration: z.number().min(5).max(480),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.query.tasks.findFirst({
        where: and(eq(schema.tasks.id, input.taskId), isNull(schema.tasks.deletedAt)),
      });
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });

      const now = new Date().toISOString();
      await ctx.db
        .update(schema.tasks)
        .set({
          scheduledDate: input.scheduledDate,
          scheduledStart: input.scheduledStart,
          scheduledDuration: input.scheduledDuration,
          updatedAt: now,
        })
        .where(eq(schema.tasks.id, input.taskId));

      return {
        id: task.id,
        scheduledDate: input.scheduledDate,
        scheduledStart: input.scheduledStart,
        scheduledDuration: input.scheduledDuration,
      };
    }),

  unschedule: publicProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.tasks)
        .set({
          scheduledDate: null,
          scheduledStart: null,
          scheduledDuration: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.tasks.id, input.taskId));

      return { success: true as const };
    }),

  getScheduled: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select({
          id: schema.tasks.id,
          title: schema.tasks.title,
          goalId: schema.tasks.goalId,
          goalTitle: schema.goals.title,
          goalColorIndex: schema.goals.colorIndex,
          scheduledDate: schema.tasks.scheduledDate,
          scheduledStart: schema.tasks.scheduledStart,
          scheduledDuration: schema.tasks.scheduledDuration,
          status: schema.tasks.status,
          estimatedMinutes: schema.tasks.estimatedMinutes,
        })
        .from(schema.tasks)
        .innerJoin(schema.goals, eq(schema.tasks.goalId, schema.goals.id))
        .where(and(
          eq(schema.goals.userId, input.userId),
          isNull(schema.tasks.deletedAt),
          isNull(schema.goals.deletedAt),
          sql`${schema.tasks.scheduledDate} IS NOT NULL`,
          gte(schema.tasks.scheduledDate, input.startDate),
          lte(schema.tasks.scheduledDate, input.endDate),
        ));

      return results;
    }),
});

async function recalculateGoalProgress(db: typeof import("@clarity/db").db, goalId: string): Promise<number> {
  const taskCounts = await db
    .select({
      total: count(),
      completed: sql<number>`sum(case when ${schema.tasks.status} = 'completed' then 1 else 0 end)`,
    })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.goalId, goalId), sql`${schema.tasks.deletedAt} IS NULL`));

  const total = taskCounts[0]?.total ?? 0;
  const completed = taskCounts[0]?.completed ?? 0;

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
