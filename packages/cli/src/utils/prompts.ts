import * as readline from "node:readline";

export function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdin.isTTY ? process.stdout : undefined,
  });
}

/**
 * Ask a question via readline. Returns empty string if the interface
 * is closed (e.g., piped input reaches EOF).
 */
export function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    const onClose = () => resolve("");
    rl.once("close", onClose);
    rl.question(question, (answer) => {
      rl.removeListener("close", onClose);
      resolve(answer.trim());
    });
  });
}

export function confirm(rl: readline.Interface, question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const onClose = () => resolve(false);
    rl.once("close", onClose);
    rl.question(`${question} (y/n) `, (answer) => {
      rl.removeListener("close", onClose);
      resolve(answer.trim().toLowerCase().startsWith("y"));
    });
  });
}

/**
 * Read all of stdin until EOF. Used for --stdin flag in non-interactive mode.
 */
export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8").trim();
}
