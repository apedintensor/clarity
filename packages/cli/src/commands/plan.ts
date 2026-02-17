import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError, printInfo } from "../utils/output";
import { createPrompt, ask } from "../utils/prompts";

const createCaller = createCallerFactory(appRouter);

export function registerPlanCommand(program: Command): void {
  program
    .command("plan")
    .description("Start an interactive daily planning session")
    .option("--skip", "Skip daily planning for today")
    .option("--json", "Output as JSON")
    .action(async (opts: { skip?: boolean; json?: boolean }) => {
      const caller = createCaller(createContext());
      const user = await caller.user.getOrCreate();

      try {
        const planResult = await caller.dailyPlan.start({ userId: user.id });

        // Handle --skip
        if (opts.skip) {
          await caller.dailyPlan.skip({ planId: planResult.id });

          if (opts.json) {
            console.log(formatJson({ skipped: true, planId: planResult.id }));
            return;
          }

          printInfo("Daily planning skipped for today.");
          return;
        }

        // If plan already confirmed, show summary
        if (planResult.status === "confirmed") {
          if (opts.json) {
            console.log(formatJson(planResult));
            return;
          }

          printInfo("Today's plan is already confirmed.");
          console.log(`  Selected tasks: ${planResult.existingSelections.length}`);
          return;
        }

        // Get available tasks grouped by goal
        const goals = await caller.goal.list({ status: "active" });

        // Collect all pending tasks across goals
        const tasksByGoal: { goalTitle: string; tasks: { id: string; title: string; estimatedMinutes: number }[] }[] = [];
        const allTasks: { id: string; title: string; estimatedMinutes: number; goalTitle: string }[] = [];

        for (const goal of goals.items) {
          const taskList = await caller.task.list({ goalId: goal.id });
          const pending = taskList.items.filter((t) => t.status === "pending" || t.status === "in_progress");
          if (pending.length > 0) {
            tasksByGoal.push({
              goalTitle: goal.title,
              tasks: pending.map((t) => ({ id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes })),
            });
            for (const t of pending) {
              allTasks.push({ id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes, goalTitle: goal.title });
            }
          }
        }

        if (opts.json) {
          console.log(formatJson({ planId: planResult.id, yesterdayUnfinished: planResult.yesterdayUnfinished, tasksByGoal }));
          return;
        }

        // Interactive mode
        const rl = createPrompt();

        try {
          // Show yesterday's unfinished
          if (planResult.yesterdayUnfinished.length > 0) {
            console.log("\n  Yesterday's unfinished tasks:");
            planResult.yesterdayUnfinished.forEach((t) => {
              console.log(`    - ${t.title} [${t.goalTitle}] (~${t.estimatedMinutes}min)`);
            });
            console.log("");
          }

          if (allTasks.length === 0) {
            printInfo("No pending tasks available. Create tasks first with: clarity breakdown <goalId>");
            rl.close();
            return;
          }

          // Display tasks grouped by goal with numbers
          console.log("\n  Available tasks:\n");
          let idx = 1;
          const taskMap = new Map<number, string>();

          for (const group of tasksByGoal) {
            console.log(`  [${group.goalTitle}]`);
            for (const t of group.tasks) {
              const selected = planResult.existingSelections.includes(t.id) ? " *" : "";
              console.log(`    ${idx}. ${t.title} (~${t.estimatedMinutes}min)${selected}`);
              taskMap.set(idx, t.id);
              idx++;
            }
            console.log("");
          }

          // Ask user to select tasks
          const answer = await ask(rl, "  Select tasks (comma-separated numbers, e.g. 1,3,5): ");
          const selectedNumbers = answer
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && taskMap.has(n));

          const selectedIds = selectedNumbers.map((n) => taskMap.get(n)!);

          // Update selections
          const updateResult = await caller.dailyPlan.updateSelections({
            planId: planResult.id,
            selectedTaskIds: selectedIds,
          });

          // Confirm
          const doConfirm = selectedIds.length > 0;
          if (doConfirm) {
            const confirmResult = await caller.dailyPlan.confirm({ planId: planResult.id });

            console.log("");
            printSuccess(`Daily plan confirmed!`);
            console.log(`  Tasks: ${confirmResult.confirmedTaskCount}`);
            console.log(`  Estimated time: ${confirmResult.totalEstimatedMinutes}min`);

            if (updateResult.isOvercommitted) {
              printInfo(`  Note: Over focus threshold by ${updateResult.overcommittedByMinutes}min`);
            }
          } else {
            printInfo("No tasks selected. Run clarity plan again to select tasks.");
          }

          rl.close();
        } catch (err) {
          rl.close();
          throw err;
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to start planning");
        process.exit(1);
      }
    });
}
