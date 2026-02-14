import { Command } from "commander";
import { createCallerFactory, createContext, appRouter } from "@clarity/core";
import { formatJson, printSuccess, printError } from "../utils/output";

const createCaller = createCallerFactory(appRouter);

export function registerDumpCommands(program: Command): void {
  program
    .command("dump [text...]")
    .description("Capture a brain dump")
    .option("--json", "Output as JSON")
    .action(async (textParts: string[], opts: { json?: boolean }) => {
      const caller = createCaller(createContext());

      // Ensure user exists
      await caller.user.getOrCreate();

      let rawText: string;

      const useStdin =
        textParts.length === 0 ||
        (textParts.length === 1 && textParts[0] === "-");

      if (useStdin) {
        // Read from stdin
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        rawText = Buffer.concat(chunks).toString("utf-8").trim();
      } else {
        rawText = textParts.join(" ");
      }

      if (!rawText) {
        printError("No text provided. Pass text as argument or pipe via stdin.");
        process.exit(1);
      }

      try {
        const dump = await caller.braindump.create({ rawText });
        if (opts.json) {
          console.log(formatJson(dump));
        } else {
          printSuccess(`Brain dump captured (${dump.id})`);
          console.log(`  Status: ${dump.status}`);
          console.log(`  Words: ${rawText.split(/\s+/).length}`);
          console.log(`\n  Next: clarity process ${dump.id}`);
        }
      } catch (err) {
        printError(err instanceof Error ? err.message : "Failed to create brain dump");
        process.exit(1);
      }
    });

  program
    .command("dumps")
    .description("List brain dumps")
    .option("--limit <n>", "Number of dumps to show", "10")
    .option("--json", "Output as JSON")
    .action(async (opts: { limit: string; json?: boolean }) => {
      const caller = createCaller(createContext());
      await caller.user.getOrCreate();

      const result = await caller.braindump.list({ limit: parseInt(opts.limit, 10) });

      if (opts.json) {
        console.log(formatJson(result));
      } else {
        if (result.items.length === 0) {
          console.log("No brain dumps yet. Run: clarity dump \"your thoughts here\"");
          return;
        }
        result.items.forEach((d) => {
          const preview = d.rawText.slice(0, 60).replace(/\n/g, " ");
          console.log(`  ${d.id.slice(0, 8)}  [${d.status}]  ${preview}...`);
        });
      }
    });
}
