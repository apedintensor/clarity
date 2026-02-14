import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { BRAIN_DUMP_ANALYSIS_PROMPT } from "./prompts";

export interface AnalysisResult {
  summary: string;
  themes: string[];
  goals: Array<{
    title: string;
    purpose: string;
    description: string;
  }>;
}

export async function analyzeBrainDump(rawText: string): Promise<AnalysisResult> {
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: BRAIN_DUMP_ANALYSIS_PROMPT + rawText,
    temperature: 0.7,
    maxTokens: 2000,
  });

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const result = JSON.parse(cleaned) as AnalysisResult;

  if (!result.summary || !Array.isArray(result.themes) || !Array.isArray(result.goals)) {
    throw new Error("Invalid AI response structure");
  }

  return result;
}
