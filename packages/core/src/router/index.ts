import { router } from "../trpc";
import { userRouter } from "./user";
import { braindumpRouter } from "./braindump";
import { clarificationRouter } from "./clarification";
import { goalRouter } from "./goal";
import { taskRouter } from "./task";
import { progressRouter } from "./progress";
import { reinforcementRouter } from "./reinforcement";

export const appRouter = router({
  user: userRouter,
  braindump: braindumpRouter,
  clarification: clarificationRouter,
  goal: goalRouter,
  task: taskRouter,
  progress: progressRouter,
  reinforcement: reinforcementRouter,
});

export type AppRouter = typeof appRouter;

export { createContext, createCallerFactory } from "../trpc";
