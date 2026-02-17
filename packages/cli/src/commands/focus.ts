import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { printError, printInfo, printReinforcement, printProgress } from "../utils/output";
import { createPrompt, ask } from "../utils/prompts";
import { resolveId } from "../utils/resolve-id";

const createCaller = createCallerFactory(appRouter);

export function registerFocusCommand(program: Command): void {
  program
    .command("focus <goalId>")
    .description("Enter focus mode — work through tasks one at a time")
    .action(async (goalId: string) => {
      const caller = createCaller(createContext());
      const rl = createPrompt();

      try {
        const resolvedGoalId = await resolveId(goalId, "goal");
        const goal = await caller.goal.get({ id: resolvedGoalId });
        printInfo(`Focus mode: ${goal.title}\n`);

        let running = true;
        while (running) {
          const next = await caller.task.getNext({ goalId: resolvedGoalId });

          if (!next.task) {
            console.log("\n  🏆 All tasks complete! Amazing work!");
            printProgress("  Goal", next.goalProgress, 100);
            break;
          }

          console.log(`\n  ─── Task ${next.position} of ${next.totalTasks} ───`);
          console.log(`\n  ${next.task.title}`);
          if (next.task.description) {
            console.log(`  ${next.task.description}`);
          }
          console.log(`\n  Done when: ${next.task.doneDefinition}`);
          console.log(`  Estimated: ~${next.task.estimatedMinutes} min`);

          const action = await ask(rl, "\n  [done/skip/quit] > ");

          if (action === "quit" || action === "q") {
            printInfo("Focus mode paused. Resume anytime with: clarity focus " + resolvedGoalId);
            running = false;
          } else if (action === "skip" || action === "s") {
            await caller.task.update({ id: next.task.id, status: "skipped" });
            printInfo("Task skipped.");
          } else if (action === "done" || action === "d" || action === "") {
            const result = await caller.task.complete({ id: next.task.id });
            printReinforcement(result.reinforcement.message);

            if (result.milestone) {
              console.log(`\n  🎯 MILESTONE: ${result.milestone}% complete!`);
            }

            if (result.streak.isNewRecord) {
              console.log(`  🔥 New streak record: ${result.streak.current} days!`);
            }

            printProgress("  Progress", result.goalProgress, 100);
          }
        }

        rl.close();
      } catch (err) {
        rl.close();
        printError(err instanceof Error ? err.message : "Focus mode error");
        process.exit(1);
      }
    });
}
