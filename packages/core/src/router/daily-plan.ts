import { z } from "zod";
import { eq, and, ne, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";

export const dailyPlanRouter = router({
  start: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date().toISOString().split("T")[0]!;

      // Check for existing plan today
      const existing = await ctx.db.query.dailyPlans.findFirst({
        where: and(
          eq(schema.dailyPlans.userId, input.userId),
          eq(schema.dailyPlans.date, today),
        ),
      });

      if (existing) {
        // Fetch yesterday's unfinished for display
        const yesterdayUnfinished = await getYesterdayUnfinished(ctx.db, input.userId, today);
        return {
          id: existing.id,
          date: existing.date,
          yesterdayUnfinished,
          existingSelections: existing.selectedTaskIds as string[],
          focusThresholdMinutes: existing.focusThresholdMinutes,
          status: existing.status as "in_progress" | "confirmed" | "skipped",
        };
      }

      const now = new Date().toISOString();
      const id = uuidv4();
      await ctx.db.insert(schema.dailyPlans).values({
        id,
        userId: input.userId,
        date: today,
        selectedTaskIds: [],
        totalEstimatedMinutes: 0,
        focusThresholdMinutes: 360,
        isOvercommitted: 0,
        status: "in_progress",
        createdAt: now,
        updatedAt: now,
      });

      const yesterdayUnfinished = await getYesterdayUnfinished(ctx.db, input.userId, today);

      return {
        id,
        date: today,
        yesterdayUnfinished,
        existingSelections: [] as string[],
        focusThresholdMinutes: 360,
        status: "in_progress" as const,
      };
    }),

  updateSelections: publicProcedure
    .input(z.object({
      planId: z.string().uuid(),
      selectedTaskIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.query.dailyPlans.findFirst({
        where: eq(schema.dailyPlans.id, input.planId),
      });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      // Calculate total estimated minutes
      let totalEstimatedMinutes = 0;
      for (const taskId of input.selectedTaskIds) {
        const task = await ctx.db.query.tasks.findFirst({
          where: eq(schema.tasks.id, taskId),
        });
        if (task) totalEstimatedMinutes += task.estimatedMinutes;
      }

      const isOvercommitted = totalEstimatedMinutes > plan.focusThresholdMinutes;
      const overcommittedByMinutes = isOvercommitted ? totalEstimatedMinutes - plan.focusThresholdMinutes : 0;

      const now = new Date().toISOString();
      await ctx.db
        .update(schema.dailyPlans)
        .set({
          selectedTaskIds: input.selectedTaskIds,
          totalEstimatedMinutes,
          isOvercommitted: isOvercommitted ? 1 : 0,
          updatedAt: now,
        })
        .where(eq(schema.dailyPlans.id, input.planId));

      return { totalEstimatedMinutes, isOvercommitted, overcommittedByMinutes };
    }),

  confirm: publicProcedure
    .input(z.object({ planId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.query.dailyPlans.findFirst({
        where: eq(schema.dailyPlans.id, input.planId),
      });
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const now = new Date().toISOString();
      await ctx.db
        .update(schema.dailyPlans)
        .set({ status: "confirmed", updatedAt: now })
        .where(eq(schema.dailyPlans.id, input.planId));

      return {
        confirmedTaskCount: (plan.selectedTaskIds as string[]).length,
        totalEstimatedMinutes: plan.totalEstimatedMinutes,
      };
    }),

  skip: publicProcedure
    .input(z.object({ planId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      await ctx.db
        .update(schema.dailyPlans)
        .set({ status: "skipped", updatedAt: now })
        .where(eq(schema.dailyPlans.id, input.planId));
      return { success: true as const };
    }),

  getToday: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const today = new Date().toISOString().split("T")[0]!;
      const plan = await ctx.db.query.dailyPlans.findFirst({
        where: and(
          eq(schema.dailyPlans.userId, input.userId),
          eq(schema.dailyPlans.date, today),
        ),
      });
      return plan ?? null;
    }),
});

async function getYesterdayUnfinished(db: typeof import("@clarity/db").db, userId: string, today: string) {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0]!;

  // Get tasks scheduled for yesterday that aren't completed
  const results = await db
    .select({
      id: schema.tasks.id,
      title: schema.tasks.title,
      goalTitle: schema.goals.title,
      estimatedMinutes: schema.tasks.estimatedMinutes,
    })
    .from(schema.tasks)
    .innerJoin(schema.goals, eq(schema.tasks.goalId, schema.goals.id))
    .where(and(
      eq(schema.goals.userId, userId),
      eq(schema.tasks.scheduledDate, yesterdayStr),
      ne(schema.tasks.status, "completed"),
      sql`${schema.tasks.deletedAt} IS NULL`,
    ));

  return results;
}
