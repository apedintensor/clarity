import { createCallerFactory, createContext, appRouter } from "@clarity/core";

const createCaller = createCallerFactory(appRouter);

/**
 * Resolve a short ID prefix (8+ chars) to a full UUID by searching
 * inbox items, goals, and tasks. If the input is already a full UUID
 * (36 chars), returns it as-is.
 */
export async function resolveId(shortId: string, hint?: "inbox" | "goal" | "task"): Promise<string> {
  // Already a full UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shortId)) {
    return shortId;
  }

  const prefix = shortId.toLowerCase();
  const caller = createCaller(createContext());
  const user = await caller.user.getOrCreate();

  // Search in order based on hint
  if (!hint || hint === "inbox") {
    const items = await caller.inbox.list({ userId: user.id, status: "unprocessed" });
    const match = items.find((i) => i.id.toLowerCase().startsWith(prefix));
    if (match) return match.id;
  }

  if (!hint || hint === "goal") {
    const goals = await caller.goal.list({});
    const match = goals.items.find((g) => g.id.toLowerCase().startsWith(prefix));
    if (match) return match.id;
  }

  if (!hint || hint === "task") {
    // Search tasks across all goals
    const goals = await caller.goal.list({});
    for (const goal of goals.items) {
      const tasks = await caller.task.list({ goalId: goal.id });
      const match = tasks.items.find((t) => t.id.toLowerCase().startsWith(prefix));
      if (match) return match.id;
    }
  }

  // Return as-is if no match — let the server return a proper error
  return shortId;
}
