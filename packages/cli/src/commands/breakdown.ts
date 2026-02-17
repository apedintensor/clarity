import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError, printInfo } from "../utils/output";
import { resolveId } from "../utils/resolve-id";

const createCaller = createCallerFactory(appRouter);

export function registerBreakdownCommands(program: Command): void {
  program
    .command("breakdown <goalId>")
    .description("Break down a goal into actionable tasks using AI")
    .option("--json", "Output as JSON")
    .action(async (goalId: string, opts: { json?: boolean }) => {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        printError("AI service is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in your .env file.");
        process.exit(1);
      }

      const caller = createCaller(createContext());

      try {
        const resolvedGoalId = await resolveId(goalId, "goal");
        printInfo("Breaking down goal with AI...");
        const result = await caller.goal.breakdown({ id: resolvedGoalId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess("Goal broken down into tasks!");

        // Fetch the updated goal with tasks
        const goal = await caller.goal.get({ id: resolvedGoalId });

        console.log(`\n  ${goal.title}`);
        console.log(`  ${goal.tasks.length} tasks generated:\n`);

        goal.tasks.forEach((t, i) => {
          console.log(`    ${i + 1}. ${t.title} (~${t.estimatedMinutes}min)`);
          console.log(`       Done when: ${t.doneDefinition}`);
        });

        console.log(`\n  Next: clarity focus ${goalId}`);
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to break down goal");
        process.exit(1);
      }
    });

  program
    .command("tasks <goalId>")
    .description("List tasks for a goal")
    .option("--json", "Output as JSON")
    .action(async (goalId: string, opts: { json?: boolean }) => {
      const caller = createCaller(createContext());
      const resolvedGoalId = await resolveId(goalId, "goal");
      const result = await caller.task.list({ goalId: resolvedGoalId });

      if (opts.json) {
        console.log(formatJson(result));
        return;
      }

      if (result.items.length === 0) {
        console.log("No tasks yet. Run: clarity breakdown " + goalId);
        return;
      }

      result.items.forEach((t) => {
        const check = t.status === "completed" ? "✓" : t.status === "in_progress" ? "▸" : "○";
        console.log(`  ${check} ${t.id.slice(0, 8)}  ${t.title} (~${t.estimatedMinutes}min)`);
      });
    });
}
