#!/usr/bin/env node
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from project root
const originalLog = console.log;
console.log = () => {};
config({ path: resolve(process.cwd(), ".env") });
console.log = originalLog;

import { Command } from "commander";
import { registerDumpCommands } from "./commands/dump";
import { registerProcessCommand } from "./commands/process";
import { registerGoalsCommands } from "./commands/goals";
import { registerBreakdownCommands } from "./commands/breakdown";
import { registerFocusCommand } from "./commands/focus";
import { registerDoneCommand } from "./commands/done";
import { registerProgressCommands } from "./commands/progress";

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

program.parse();
