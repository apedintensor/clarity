import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printProgress } from "../utils/output";
import type { GoalStatus } from "@clarity/types";

const createCaller = createCallerFactory(appRouter);

export function registerGoalsCommands(program: Command): void {
  program
    .command("goals")
    .description("List goals")
    .option("--status <status>", "Filter by status (active, completed, archived)")
    .option("--json", "Output as JSON")
    .action(async (opts: { status?: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      const status = opts.status as GoalStatus | undefined;
      const result = await caller.goal.list({ status });

      if (opts.json) {
        console.log(formatJson(result));
        return;
      }

      if (result.items.length === 0) {
        console.log("No goals found. Process a brain dump first: clarity process <dump-id>");
        return;
      }

      result.items.forEach((g) => {
        console.log(`\n  ${g.id.slice(0, 8)}  [${g.status}]  ${g.title}`);
        console.log(`  Why: ${g.purpose}`);
        printProgress("  Progress", g.completedTaskCount, g.taskCount);
      });
    });

  program
    .command("goal <id>")
    .description("Show goal details with tasks")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      const caller = createCaller(createContext());

      const goal = await caller.goal.get({ id });

      if (opts.json) {
        console.log(formatJson(goal));
        return;
      }

      console.log(`\n  ${goal.title}`);
      console.log(`  Why: ${goal.purpose}`);
      console.log(`  Status: ${goal.status}`);

      if (goal.tasks.length > 0) {
        console.log(`\n  Tasks (${goal.tasks.length}):`);
        goal.tasks.forEach((t) => {
          const check = t.status === "completed" ? "✓" : t.status === "in_progress" ? "▸" : "○";
          console.log(`    ${check} ${t.title} (~${t.estimatedMinutes}min)`);
          console.log(`      Done when: ${t.doneDefinition}`);
        });
      } else {
        console.log("\n  No tasks yet. Run: clarity breakdown " + id);
      }
    });
}
