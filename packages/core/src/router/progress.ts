import { z } from "zod";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";

export const progressRouter = router({
  dashboard: publicProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst();
    if (!user) {
      return {
        activeGoals: [],
        streak: { current: 0, longest: 0 },
        today: { tasksCompleted: 0, focusMinutes: 0 },
        recentCompletions: [],
        weeklyActivity: [],
      };
    }

    // Active goals with counts
    const goalsList = await ctx.db
      .select()
      .from(schema.goals)
      .where(and(eq(schema.goals.userId, user.id), eq(schema.goals.status, "active")))
      .orderBy(schema.goals.sortOrder);

    const activeGoals = await Promise.all(
      goalsList.map(async (goal) => {
        const taskCounts = await ctx.db
          .select({
            total: count(),
            completed: sql<number>`sum(case when ${schema.tasks.status} = 'completed' then 1 else 0 end)`,
          })
          .from(schema.tasks)
          .where(eq(schema.tasks.goalId, goal.id));

        return {
          ...goal,
          taskCount: taskCounts[0]?.total ?? 0,
          completedTaskCount: taskCounts[0]?.completed ?? 0,
        };
      }),
    );

    // Today's record
    const today = new Date().toISOString().split("T")[0]!;
    const todayRecord = await ctx.db.query.progressRecords.findFirst({
      where: and(
        eq(schema.progressRecords.userId, user.id),
        eq(schema.progressRecords.date, today),
      ),
    });

    // Recent completions (last 10)
    const recentCompletions = await ctx.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.status, "completed"))
      .orderBy(desc(schema.tasks.completedAt))
      .limit(10);

    // Weekly activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]!;
    const weeklyActivity = await ctx.db
      .select()
      .from(schema.progressRecords)
      .where(
        and(
          eq(schema.progressRecords.userId, user.id),
          gte(schema.progressRecords.date, weekAgo),
        ),
      )
      .orderBy(desc(schema.progressRecords.date));

    return {
      activeGoals,
      streak: { current: user.currentStreak, longest: user.longestStreak },
      today: {
        tasksCompleted: todayRecord?.tasksCompleted ?? 0,
        focusMinutes: todayRecord?.focusMinutes ?? 0,
      },
      recentCompletions,
      weeklyActivity,
    };
  }),

  history: publicProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }).default({}))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) {
        return {
          records: [],
          totalTasksCompleted: 0,
          totalGoalsCompleted: 0,
          totalFocusMinutes: 0,
          averageTasksPerDay: 0,
        };
      }

      const startDate = new Date(Date.now() - input.days * 86400000).toISOString().split("T")[0]!;

      const records = await ctx.db
        .select()
        .from(schema.progressRecords)
        .where(
          and(
            eq(schema.progressRecords.userId, user.id),
            gte(schema.progressRecords.date, startDate),
          ),
        )
        .orderBy(desc(schema.progressRecords.date));

      const totals = records.reduce(
        (acc, r) => ({
          tasksCompleted: acc.tasksCompleted + r.tasksCompleted,
          goalsAdvanced: acc.goalsAdvanced + r.goalsAdvanced,
          focusMinutes: acc.focusMinutes + r.focusMinutes,
        }),
        { tasksCompleted: 0, goalsAdvanced: 0, focusMinutes: 0 },
      );

      const completedGoals = await ctx.db
        .select({ count: count() })
        .from(schema.goals)
        .where(and(eq(schema.goals.userId, user.id), eq(schema.goals.status, "completed")));

      return {
        records,
        totalTasksCompleted: totals.tasksCompleted,
        totalGoalsCompleted: completedGoals[0]?.count ?? 0,
        totalFocusMinutes: totals.focusMinutes,
        averageTasksPerDay: records.length > 0 ? Math.round(totals.tasksCompleted / records.length) : 0,
      };
    }),
});
