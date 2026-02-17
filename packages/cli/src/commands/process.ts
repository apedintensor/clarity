import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError, printInfo } from "../utils/output";
import { createPrompt, ask } from "../utils/prompts";
import { resolveId } from "../utils/resolve-id";

const createCaller = createCallerFactory(appRouter);

export function registerProcessCommand(program: Command): void {
  program
    .command("process <id>")
    .description("Process a brain dump with AI")
    .option("--json", "Output as JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        printError("AI service is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in your .env file.");
        process.exit(1);
      }

      const caller = createCaller(createContext());

      try {
        const resolvedId = await resolveId(id, undefined);
        printInfo("Processing brain dump with AI...");
        const result = await caller.braindump.process({ id: resolvedId });

        if (opts.json) {
          console.log(formatJson(result));
          return;
        }

        printSuccess("Brain dump processed!");

        // Get updated dump with clarifications
        const dump = await caller.braindump.get({ id: resolvedId });

        if (dump.themes && dump.themes.length > 0) {
          console.log("\n  Themes:", dump.themes.join(", "));
        }

        if (dump.aiSummary) {
          console.log("\n  Summary:", dump.aiSummary);
        }

        // Interactive clarification
        const pending = dump.clarifications.filter((c) => c.status === "pending");
        if (pending.length > 0) {
          printInfo(`\n${pending.length} clarification question(s):\n`);
          const rl = createPrompt();

          for (const c of pending) {
            console.log(`  Q: ${c.question}`);
            if (c.suggestedAnswers && c.suggestedAnswers.length > 0) {
              c.suggestedAnswers.forEach((a, i) => console.log(`     ${i + 1}. ${a}`));
            }

            const answer = await ask(rl, "  Your answer (or 'skip'): ");
            if (answer.toLowerCase() === "skip") {
              await caller.clarification.skip({ id: c.id });
            } else {
              await caller.clarification.answer({ id: c.id, answer });
            }
          }

          rl.close();
          printSuccess("Clarifications complete!");
        }

        // Show goals
        if (dump.goals.length > 0) {
          console.log("\n  Goals:");
          dump.goals.forEach((g) => {
            console.log(`    • ${g.title}`);
            console.log(`      Why: ${g.purpose}`);
          });
          console.log(`\n  Next: clarity breakdown <goal-id>`);
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to process brain dump");
        process.exit(1);
      }
    });
}
