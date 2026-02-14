import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { TASK_DECOMPOSITION_PROMPT } from "./prompts";

export interface DecomposedTask {
  title: string;
  description: string;
  doneDefinition: string;
  estimatedMinutes: number;
  dependsOn: number[];
}

export interface DecompositionResult {
  tasks: DecomposedTask[];
}

export async function decomposeGoalIntoTasks(goal: {
  title: string;
  purpose: string;
  description: string | null;
  context?: string;
}): Promise<DecompositionResult> {
  const prompt = TASK_DECOMPOSITION_PROMPT
    .replace("{title}", goal.title)
    .replace("{purpose}", goal.purpose)
    .replace("{description}", goal.description ?? "No additional description")
    .replace("{context}", goal.context ?? "No additional context");

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt,
    temperature: 0.6,
    maxTokens: 3000,
  });

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const result = JSON.parse(cleaned) as DecompositionResult;

  if (!Array.isArray(result.tasks) || result.tasks.length === 0) {
    throw new Error("AI did not generate any tasks");
  }

  // Enforce time bounds: split tasks >90 min, floor at 25 min
  const validatedTasks = result.tasks.map((task) => ({
    ...task,
    estimatedMinutes: Math.max(25, Math.min(90, task.estimatedMinutes)),
  }));

  return { tasks: validatedTasks };
}
