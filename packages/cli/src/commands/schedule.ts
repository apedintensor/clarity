import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError, printInfo } from "../utils/output";
import { resolveId } from "../utils/resolve-id";

const createCaller = createCallerFactory(appRouter);

export function registerScheduleCommands(program: Command): void {
  program
    .command("schedule <taskId>")
    .description("Schedule a task to a date")
    .requiredOption("--date <date>", "Date in YYYY-MM-DD format")
    .option("--time <time>", "Start time in HH:MM format")
    .option("--duration <minutes>", "Duration in minutes", "30")
    .option("--json", "Output as JSON")
    .action(async (taskId: string, opts: { date: string; time?: string; duration: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) {
        printError("Required: --date YYYY-MM-DD");
        process.exit(1);
      }

      const resolvedTaskId = await resolveId(taskId, "task");

      try {
        if (opts.time) {
          if (!/^\d{2}:\d{2}$/.test(opts.time)) {
            printError("Time must be in HH:MM format");
            process.exit(1);
          }

          const result = await caller.task.schedule({
            taskId: resolvedTaskId,
            scheduledDate: opts.date,
            scheduledStart: opts.time,
            scheduledDuration: parseInt(opts.duration, 10),
          });

          if (opts.json) {
            console.log(formatJson(result));
            return;
          }

          printSuccess(`Task scheduled for ${result.scheduledDate} at ${result.scheduledStart} (${result.scheduledDuration}min)`);
        } else {
          // Day-level scheduling only — use task.update
          const result = await caller.task.update({
            id: resolvedTaskId,
            scheduledDate: opts.date,
            scheduledStart: null,
            scheduledDuration: null,
          });

          if (opts.json) {
            console.log(formatJson(result));
            return;
          }

          printSuccess(`Task scheduled for ${opts.date}`);
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to schedule task");
        process.exit(1);
      }
    });

  program
    .command("unschedule <taskId>")
    .description("Clear a task's schedule")
    .option("--json", "Output as JSON")
    .action(async (taskId: string, opts: { json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      try {
        const resolvedTaskId = await resolveId(taskId, "task");
        const result = await caller.task.unschedule({ taskId: resolvedTaskId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess("Task unscheduled");
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to unschedule task");
        process.exit(1);
      }
    });

  program
    .command("calendar")
    .description("View scheduled tasks for the week")
    .option("--date <date>", "Show the week containing this date (YYYY-MM-DD)")
    .option("--json", "Output as JSON")
    .action(async (opts: { date?: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      const user = await caller.user.getOrCreate();

      try {
        // Determine week range (Sunday to Saturday)
        const anchor = opts.date ? new Date(opts.date + "T00:00:00") : new Date();
        const dayOfWeek = anchor.getDay(); // 0 = Sunday
        const sunday = new Date(anchor);
        sunday.setDate(anchor.getDate() - dayOfWeek);
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);

        const startDate = formatDate(sunday);
        const endDate = formatDate(saturday);

        const tasks = await caller.task.getScheduled({ userId: user.id, startDate, endDate });

        if (opts.json) {
          console.log(formatJson(tasks));
          return;
        }

        // Group by date
        const byDate = new Map<string, typeof tasks>();
        for (let d = new Date(sunday); d <= saturday; d.setDate(d.getDate() + 1)) {
          byDate.set(formatDate(d), []);
        }
        for (const task of tasks) {
          const dateKey = task.scheduledDate!;
          const existing = byDate.get(dateKey);
          if (existing) {
            existing.push(task);
          }
        }

        if (tasks.length === 0) {
          printInfo("No tasks scheduled this week.");
        }

        console.log(`\n  Week of ${startDate} to ${endDate}\n`);

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (const [date, dayTasks] of byDate) {
          const d = new Date(date + "T00:00:00");
          const dayName = dayNames[d.getDay()];
          console.log(`  ${dayName} ${date}`);

          if (dayTasks.length === 0) {
            console.log("    (no tasks)");
          } else {
            for (const t of dayTasks) {
              const time = t.scheduledStart ? ` ${t.scheduledStart}` : "";
              const dur = t.scheduledDuration ? ` (${t.scheduledDuration}min)` : "";
              const goal = t.goalTitle ? ` [${t.goalTitle}]` : "";
              console.log(`    ${t.title}${time}${dur}${goal}`);
            }
          }
          console.log("");
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to load calendar");
        process.exit(1);
      }
    });
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
