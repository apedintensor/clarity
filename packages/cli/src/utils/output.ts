import chalk from "chalk";

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function printSuccess(message: string): void {
  console.log(chalk.green("✓"), message);
}

export function printError(message: string): void {
  console.error(chalk.red("✗"), message);
}

export function printInfo(message: string): void {
  console.log(chalk.blue("ℹ"), message);
}

export function printReinforcement(message: string): void {
  console.log(chalk.yellow("★"), chalk.bold(message));
}

export function printProgress(label: string, current: number, total: number): void {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const filled = Math.round(pct / 5);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  console.log(`${label}: ${bar} ${pct}% (${current}/${total})`);
}

export function printTable(rows: Record<string, string | number>[]): void {
  if (rows.length === 0) return;

  const keys = Object.keys(rows[0]!);
  const widths = keys.map((k) =>
    Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)),
  );

  const header = keys.map((k, i) => k.padEnd(widths[i]!)).join("  ");
  const sep = widths.map((w) => "─".repeat(w)).join("──");

  console.log(chalk.dim(header));
  console.log(chalk.dim(sep));
  rows.forEach((row) => {
    const line = keys.map((k, i) => String(row[k] ?? "").padEnd(widths[i]!)).join("  ");
    console.log(line);
  });
}
