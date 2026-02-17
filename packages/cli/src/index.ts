#!/usr/bin/env node
import { config } from "dotenv";
import { dirname, join, parse } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

function findUp(fileName: string, startDir: string): string | null {
  let current = startDir;
  const root = parse(startDir).root;

  while (true) {
    const candidate = join(current, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }

    if (current === root) {
      return null;
    }

    current = dirname(current);
  }
}

// Load .env from nearest parent directory (works with pnpm --filter and monorepo execution)
const originalLog = console.log;
console.log = () => {};

const fromCwd = findUp(".env", process.cwd());
const moduleDir = dirname(fileURLToPath(import.meta.url));
const fromModuleDir = findUp(".env", moduleDir);
const envPath = fromCwd ?? fromModuleDir;

if (envPath) {
  config({ path: envPath });
} else {
  config();
}

console.log = originalLog;

import { Command } from "commander";
import { registerDumpCommands } from "./commands/dump";
import { registerProcessCommand } from "./commands/process";
import { registerGoalsCommands } from "./commands/goals";
import { registerBreakdownCommands } from "./commands/breakdown";
import { registerFocusCommand } from "./commands/focus";
import { registerDoneCommand } from "./commands/done";
import { registerProgressCommands } from "./commands/progress";
import { registerInboxCommands } from "./commands/inbox";
import { registerScheduleCommands } from "./commands/schedule";
import { registerPlanCommand } from "./commands/plan";
import { registerChatCommand } from "./commands/chat";

const program = new Command();

program
  .name("clarity")
  .description("Braindump to Action — Transform thoughts into actionable steps")
  .version("0.1.0");

registerDumpCommands(program);
registerProcessCommand(program);
registerGoalsCommands(program);
registerBreakdownCommands(program);
registerFocusCommand(program);
registerDoneCommand(program);
registerProgressCommands(program);
registerInboxCommands(program);
registerScheduleCommands(program);
registerPlanCommand(program);
registerChatCommand(program);

program.parse();
