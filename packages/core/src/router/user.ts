import { z } from "zod";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";

export const userRouter = router({
  getOrCreate: publicProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db.query.users.findFirst();
    if (existing) return existing;

    const now = new Date().toISOString();
    const newUser = {
      id: uuidv4(),
      name: "Me",
      email: null,
      geminiApiKey: null,
      preferences: {},
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert(schema.users).values(newUser);
    return newUser;
  }),

  updatePreferences: publicProcedure
    .input(
      z.object({
        preferences: z.object({
          theme: z.enum(["light", "dark", "system"]).optional(),
          defaultTimerMinutes: z.number().min(1).max(120).optional(),
          celebrationStyle: z.enum(["minimal", "standard", "enthusiastic"]).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new Error("No user found");

      const now = new Date().toISOString();
      const mergedPreferences = { ...user.preferences, ...input.preferences };

      await ctx.db
        .update(schema.users)
        .set({ preferences: mergedPreferences, updatedAt: now })
        .where(eq(schema.users.id, user.id));

      return { ...user, preferences: mergedPreferences, updatedAt: now };
    }),
});
