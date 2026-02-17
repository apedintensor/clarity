import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { router, publicProcedure } from "../trpc";
import { schema } from "@clarity/db";

export const conversationRouter = router({
  getOrCreate: publicProcedure
    .input(z.object({
      inboxItemId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for existing conversation
      const existing = await ctx.db.query.conversations.findFirst({
        where: eq(schema.conversations.inboxItemId, input.inboxItemId),
      });

      if (existing) {
        const messages = await ctx.db
          .select()
          .from(schema.conversationMessages)
          .where(eq(schema.conversationMessages.conversationId, existing.id))
          .orderBy(asc(schema.conversationMessages.createdAt));

        return { conversation: existing, messages };
      }

      // Get user
      const user = await ctx.db.query.users.findFirst();
      if (!user) throw new Error("No user found");

      const now = new Date().toISOString();
      const conversation = {
        id: uuidv4(),
        userId: user.id,
        inboxItemId: input.inboxItemId,
        createdAt: now,
        updatedAt: now,
      };

      await ctx.db.insert(schema.conversations).values(conversation);

      return { conversation, messages: [] };
    }),

  addMessage: publicProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const message = {
        id: uuidv4(),
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        createdAt: now,
      };

      await ctx.db.insert(schema.conversationMessages).values(message);

      // Update conversation timestamp
      await ctx.db
        .update(schema.conversations)
        .set({ updatedAt: now })
        .where(eq(schema.conversations.id, input.conversationId));

      return { message };
    }),

  saveAssistantMessage: publicProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const message = {
        id: uuidv4(),
        conversationId: input.conversationId,
        role: "assistant" as const,
        content: input.content,
        createdAt: now,
      };

      await ctx.db.insert(schema.conversationMessages).values(message);

      await ctx.db
        .update(schema.conversations)
        .set({ updatedAt: now })
        .where(eq(schema.conversations.id, input.conversationId));

      return { message };
    }),
});
