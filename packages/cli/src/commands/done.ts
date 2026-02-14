import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError, printReinforcement } from "../utils/output";

const createCaller = createCallerFactory(appRouter);

export function registerDoneCommand(program: Command): void {
  program
    .command("done <taskId>")
    .description("Mark a task as complete")
    .option("--json", "Output as JSON")
    .action(async (taskId: string, opts: { json?: boolean }) => {
      const caller = createCaller(createContext());

      try {
        const result = await caller.task.complete({ id: taskId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess(`Task complete: ${result.completedTask.title}`);
        printReinforcement(result.reinforcement.message);

        if (result.milestone) {
          console.log(`  🎯 Milestone: ${result.milestone}%`);
        }

        console.log(`  Progress: ${result.goalProgress}%`);
        console.log(`  Streak: ${result.streak.current} days`);

        if (result.nextTask) {
          console.log(`\n  Next task: ${result.nextTask.title}`);
          console.log(`  Run: clarity done ${result.nextTask.id}`);
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to complete task");
        process.exit(1);
      }
    });
}
