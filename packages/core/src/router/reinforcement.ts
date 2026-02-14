import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getReinforcementMessage } from "../services/reinforcement";

export const reinforcementRouter = router({
  getMessage: publicProcedure
    .input(
      z.object({
        type: z.enum(["completion", "milestone", "streak", "return"]),
        context: z
          .object({
            taskTitle: z.string().optional(),
            goalTitle: z.string().optional(),
            progress: z.number().optional(),
            streakCount: z.number().optional(),
          })
          .optional(),
      }),
    )
    .query(({ input }) => {
      return getReinforcementMessage(input.type, input.context);
    }),
});
