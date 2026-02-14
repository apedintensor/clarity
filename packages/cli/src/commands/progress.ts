import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printProgress } from "../utils/output";

const createCaller = createCallerFactory(appRouter);

export function registerProgressCommands(program: Command): void {
  program
    .command("progress")
    .description("Show dashboard overview")
    .option("--json", "Output as JSON")
    .action(async (opts: { json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      const dashboard = await caller.progress.dashboard();

      if (opts.json) {
        console.log(formatJson(dashboard));
        return;
      }

      console.log("\n  ═══ Clarity Dashboard ═══\n");

      // Streak
      console.log(`  🔥 Streak: ${dashboard.streak.current} days (best: ${dashboard.streak.longest})`);
      console.log(`  📊 Today: ${dashboard.today.tasksCompleted} tasks, ${dashboard.today.focusMinutes} min focused\n`);

      // Active goals
      if (dashboard.activeGoals.length > 0) {
        console.log("  Active Goals:");
        dashboard.activeGoals.forEach((g) => {
          printProgress(`    ${g.title}`, g.completedTaskCount, g.taskCount);
        });
      } else {
        console.log("  No active goals. Start with: clarity dump \"your thoughts\"");
      }

      // Recent completions
      if (dashboard.recentCompletions.length > 0) {
        console.log("\n  Recent:");
        dashboard.recentCompletions.slice(0, 5).forEach((t) => {
          console.log(`    ✓ ${t.title}`);
        });
      }
    });

  program
    .command("history")
    .description("Show progress history")
    .option("--days <n>", "Number of days to show", "30")
    .option("--json", "Output as JSON")
    .action(async (opts: { days: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      const history = await caller.progress.history({ days: parseInt(opts.days, 10) });

      if (opts.json) {
        console.log(formatJson(history));
        return;
      }

      console.log(`\n  ═══ ${opts.days}-Day History ═══\n`);
      console.log(`  Tasks completed: ${history.totalTasksCompleted}`);
      console.log(`  Goals completed: ${history.totalGoalsCompleted}`);
      console.log(`  Focus time: ${history.totalFocusMinutes} min`);
      console.log(`  Avg tasks/day: ${history.averageTasksPerDay}`);
    });
}
