import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";

export const clarificationRouter = router({
  answer: publicProcedure
    .input(z.object({ id: z.string().uuid(), answer: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const clarification = await ctx.db.query.clarifications.findFirst({
        where: eq(schema.clarifications.id, input.id),
      });

      if (!clarification) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Clarification not found" });
      }

      const now = new Date().toISOString();
      await ctx.db
        .update(schema.clarifications)
        .set({ userAnswer: input.answer, status: "answered", updatedAt: now })
        .where(eq(schema.clarifications.id, input.id));

      return { ...clarification, userAnswer: input.answer, status: "answered" as const, updatedAt: now };
    }),

  skip: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const clarification = await ctx.db.query.clarifications.findFirst({
        where: eq(schema.clarifications.id, input.id),
      });

      if (!clarification) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Clarification not found" });
      }

      const now = new Date().toISOString();
      await ctx.db
        .update(schema.clarifications)
        .set({ status: "skipped", updatedAt: now })
        .where(eq(schema.clarifications.id, input.id));

      return { ...clarification, status: "skipped" as const, updatedAt: now };
    }),

  answerAll: publicProcedure
    .input(z.object({ answers: z.array(z.object({ id: z.string().uuid(), answer: z.string().trim().min(1) })) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const updated = [];

      for (const { id, answer } of input.answers) {
        await ctx.db
          .update(schema.clarifications)
          .set({ userAnswer: answer, status: "answered", updatedAt: now })
          .where(eq(schema.clarifications.id, id));

        const clarification = await ctx.db.query.clarifications.findFirst({
          where: eq(schema.clarifications.id, id),
        });
        if (clarification) updated.push(clarification);
      }

      return { clarifications: updated };
    }),
});
