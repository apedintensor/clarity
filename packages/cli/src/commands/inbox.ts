import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError } from "../utils/output";
import { resolveId } from "../utils/resolve-id";

const createCaller = createCallerFactory(appRouter);

export function registerInboxCommands(program: Command): void {
  const inbox = program
    .command("inbox")
    .description("Manage inbox items");

  inbox
    .command("list", { isDefault: true })
    .description("List unprocessed inbox items")
    .option("--json", "Output as JSON")
    .action(async (opts: { json?: boolean }) => {
      const caller = createCaller(createContext());
      const user = await caller.user.getOrCreate();

      try {
        const items = await caller.inbox.list({ userId: user.id, status: "unprocessed" });

        if (opts.json) {
          console.log(formatJson(items));
          return;
        }

        if (items.length === 0) {
          console.log('Inbox is empty. Add items with: clarity inbox add "your item"');
          return;
        }

        console.log(`\n  Inbox (${items.length} items):\n`);
        items.forEach((item) => {
          const date = item.createdAt.split("T")[0];
          console.log(`  ${item.id.slice(0, 8)}  ${item.title}  (${date})`);
        });
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to list inbox");
        process.exit(1);
      }
    });

  inbox
    .command("add <text>")
    .description("Add a new inbox item")
    .option("--json", "Output as JSON")
    .action(async (text: string, opts: { json?: boolean }) => {
      const caller = createCaller(createContext());
      const user = await caller.user.getOrCreate();

      try {
        const result = await caller.inbox.create({ userId: user.id, title: text });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess(`Inbox item created (${result.id.slice(0, 8)})`);
        console.log(`  ID: ${result.id}`);
        console.log(`  Title: ${result.title}`);
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to add inbox item");
        process.exit(1);
      }
    });

  inbox
    .command("convert <id>")
    .description("Convert an inbox item to a goal")
    .requiredOption("--to <type>", "Convert to: goal")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { to: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      if (opts.to !== "goal") {
        printError('Only --to goal is supported. Use "clarity inbox assign" to assign to an existing goal.');
        process.exit(1);
      }

      try {
        const resolvedId = await resolveId(id, "inbox");
        const result = await caller.inbox.convertToGoal({ inboxItemId: resolvedId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess(`Inbox item converted to goal (${result.goalId.slice(0, 8)})`);
        console.log(`  Goal ID: ${result.goalId}`);
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to convert inbox item");
        process.exit(1);
      }
    });

  inbox
    .command("assign <id>")
    .description("Assign an inbox item to an existing goal as a task")
    .requiredOption("--goal <goalId>", "Target goal ID")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { goal: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      try {
        const resolvedId = await resolveId(id, "inbox");
        const resolvedGoalId = await resolveId(opts.goal, "goal");
        const result = await caller.inbox.convertToTask({ inboxItemId: resolvedId, goalId: resolvedGoalId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess(`Inbox item assigned to goal as task (${result.taskId.slice(0, 8)})`);
        console.log(`  Task ID: ${result.taskId}`);
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to assign inbox item");
        process.exit(1);
      }
    });

  inbox
    .command("subtask <id>")
    .description("Convert an inbox item to a subtask of an existing task")
    .requiredOption("--task <taskId>", "Parent task ID")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { task: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      try {
        const resolvedId = await resolveId(id, "inbox");
        const resolvedTaskId = await resolveId(opts.task, "task");
        const result = await caller.inbox.convertToSubtask({ inboxItemId: resolvedId, taskId: resolvedTaskId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess(`Inbox item converted to subtask (${result.subtaskId.slice(0, 8)})`);
        console.log(`  Subtask ID: ${result.subtaskId}`);
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to convert inbox item to subtask");
        process.exit(1);
      }
    });

  inbox
    .command("delete <id>")
    .description("Delete an inbox item")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      try {
        const resolvedId = await resolveId(id, "inbox");
        const result = await caller.inbox.softDelete({ id: resolvedId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess(`Inbox item deleted (${id.slice(0, 8)})`);
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to delete inbox item");
        process.exit(1);
      }
    });
}
