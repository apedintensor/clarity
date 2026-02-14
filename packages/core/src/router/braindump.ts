import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";
import { analyzeBrainDump } from "../ai/brain-dump-analyzer";
import { generateClarifications } from "../ai/clarifier";

export const braindumpRouter = router({
  create: publicProcedure
    .input(z.object({ rawText: z.string().trim().min(1, "Brain dump cannot be empty") }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No user found. Call user.getOrCreate first." });

      const now = new Date().toISOString();
      const dump = {
        id: uuidv4(),
        userId: user.id,
        rawText: input.rawText,
        status: "raw" as const,
        aiSummary: null,
        themes: null,
        createdAt: now,
        updatedAt: now,
      };

      await ctx.db.insert(schema.brainDumps).values(dump);
      return dump;
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }).default({}),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst();
      if (!user) return { items: [], nextCursor: undefined };

      let query = ctx.db
        .select()
        .from(schema.brainDumps)
        .where(eq(schema.brainDumps.userId, user.id))
        .orderBy(desc(schema.brainDumps.createdAt))
        .limit(input.limit + 1);

      if (input.cursor) {
        const cursorDump = await ctx.db.query.brainDumps.findFirst({
          where: eq(schema.brainDumps.id, input.cursor),
        });
        if (cursorDump) {
          query = ctx.db
            .select()
            .from(schema.brainDumps)
            .where(eq(schema.brainDumps.userId, user.id))
            .orderBy(desc(schema.brainDumps.createdAt))
            .limit(input.limit + 1);
        }
      }

      const items = await query;
      let nextCursor: string | undefined;

      if (items.length > input.limit) {
        const extra = items.pop();
        nextCursor = extra?.id;
      }

      return { items, nextCursor };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const dump = await ctx.db.query.brainDumps.findFirst({
        where: eq(schema.brainDumps.id, input.id),
      });

      if (!dump) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brain dump not found" });
      }

      const clarificationsList = await ctx.db
        .select()
        .from(schema.clarifications)
        .where(eq(schema.clarifications.brainDumpId, dump.id))
        .orderBy(schema.clarifications.sortOrder);

      const goalsList = await ctx.db
        .select()
        .from(schema.goals)
        .where(eq(schema.goals.brainDumpId, dump.id))
        .orderBy(schema.goals.sortOrder);

      return { ...dump, clarifications: clarificationsList, goals: goalsList };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        appendText: z.string().optional(),
        aiSummary: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dump = await ctx.db.query.brainDumps.findFirst({
        where: eq(schema.brainDumps.id, input.id),
      });

      if (!dump) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brain dump not found" });
      }

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = { updatedAt: now };

      if (input.appendText) {
        updates.rawText = dump.rawText + "\n" + input.appendText;
      }
      if (input.aiSummary !== undefined) {
        updates.aiSummary = input.aiSummary;
      }

      await ctx.db
        .update(schema.brainDumps)
        .set(updates)
        .where(eq(schema.brainDumps.id, input.id));

      return { ...dump, ...updates };
    }),

  process: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const dump = await ctx.db.query.brainDumps.findFirst({
        where: eq(schema.brainDumps.id, input.id),
      });

      if (!dump) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Brain dump not found" });
      }

      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No user found" });

      // Set status to processing
      const now = new Date().toISOString();
      await ctx.db
        .update(schema.brainDumps)
        .set({ status: "processing", updatedAt: now })
        .where(eq(schema.brainDumps.id, input.id));

      try {
        // Analyze with AI
        const analysis = await analyzeBrainDump(dump.rawText);

        // Update dump with AI results
        await ctx.db
          .update(schema.brainDumps)
          .set({
            status: "organized",
            aiSummary: analysis.summary,
            themes: analysis.themes,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.brainDumps.id, input.id));

        // Create goals from analysis
        const createdGoals = [];
        for (let i = 0; i < analysis.goals.length; i++) {
          const g = analysis.goals[i]!;
          const goal = {
            id: uuidv4(),
            userId: user.id,
            brainDumpId: input.id,
            title: g.title,
            purpose: g.purpose,
            description: g.description,
            status: "active" as const,
            progress: 0,
            sortOrder: i,
            completedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await ctx.db.insert(schema.goals).values(goal);
          createdGoals.push(goal);
        }

        // Generate clarification questions
        const analysisJson = JSON.stringify(analysis);
        const clarificationResult = await generateClarifications(dump.rawText, analysisJson);

        const createdClarifications = [];
        for (let i = 0; i < clarificationResult.questions.length; i++) {
          const q = clarificationResult.questions[i]!;
          const clarification = {
            id: uuidv4(),
            brainDumpId: input.id,
            question: q.question,
            suggestedAnswers: q.suggestedAnswers,
            userAnswer: null,
            status: "pending" as const,
            sortOrder: i,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await ctx.db.insert(schema.clarifications).values(clarification);
          createdClarifications.push(clarification);
        }

        return {
          summary: analysis.summary,
          themes: analysis.themes,
          goals: createdGoals,
          clarifications: createdClarifications,
        };
      } catch (err) {
        // Set status to error on failure
        await ctx.db
          .update(schema.brainDumps)
          .set({ status: "error", updatedAt: new Date().toISOString() })
          .where(eq(schema.brainDumps.id, input.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "AI processing failed",
        });
      }
    }),
});
