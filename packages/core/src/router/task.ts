import { z } from "zod";
import { eq, and, count, sql } from "drizzle-orm";
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
        .where(eq(schema.tasks.goalId, input.goalId))
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
        estimatedMinutes: z.number().min(5).max(120).optional(),
        status: z.enum(["pending", "in_progress", "completed", "skipped"]).optional(),
        sortOrder: z.number().optional(),
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
});

async function recalculateGoalProgress(db: typeof import("@clarity/db").db, goalId: string): Promise<number> {
  const taskCounts = await db
    .select({
      total: count(),
      completed: sql<number>`sum(case when ${schema.tasks.status} = 'completed' then 1 else 0 end)`,
    })
    .from(schema.tasks)
    .where(eq(schema.tasks.goalId, goalId));

  const total = taskCounts[0]?.total ?? 0;
  const completed = taskCounts[0]?.completed ?? 0;

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
