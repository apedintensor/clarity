import { router } from "../trpc";
import { userRouter } from "./user";
import { braindumpRouter } from "./braindump";
import { clarificationRouter } from "./clarification";
import { goalRouter } from "./goal";
import { taskRouter } from "./task";
import { progressRouter } from "./progress";
import { reinforcementRouter } from "./reinforcement";
import { inboxRouter } from "./inbox";
import { conversationRouter } from "./conversation";
import { dailyPlanRouter } from "./daily-plan";

export const appRouter = router({
  user: userRouter,
  braindump: braindumpRouter,
  clarification: clarificationRouter,
  goal: goalRouter,
  task: taskRouter,
  progress: progressRouter,
  reinforcement: reinforcementRouter,
  inbox: inboxRouter,
  conversation: conversationRouter,
  dailyPlan: dailyPlanRouter,
});

export type AppRouter = typeof appRouter;

export { createContext, createCallerFactory } from "../trpc";
export { parseSuggestions, stripSuggestionBlock } from "../ai/suggestion-parser";
export type { Suggestion, SuggestionTask } from "../ai/suggestion-parser";
export { INBOX_CHAT_SYSTEM_PROMPT, buildChatMessages } from "../ai/inbox-chat";
