import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { CLARIFICATION_PROMPT, REFINEMENT_PROMPT } from "./prompts";

export interface ClarificationQuestion {
  question: string;
  suggestedAnswers: string[];
}

export interface ClarificationResult {
  questions: ClarificationQuestion[];
}

export async function generateClarifications(
  rawText: string,
  analysis: string,
): Promise<ClarificationResult> {
  const prompt = CLARIFICATION_PROMPT
    .replace("{rawText}", rawText)
    .replace("{analysis}", analysis);

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt,
    temperature: 0.7,
    maxTokens: 1500,
  });

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const result = JSON.parse(cleaned) as ClarificationResult;

  if (!Array.isArray(result.questions)) {
    throw new Error("Invalid clarification response structure");
  }

  return result;
}

export interface RefinedAnalysis {
  summary: string;
  themes: string[];
  goals: Array<{
    title: string;
    purpose: string;
    description: string;
  }>;
}

export async function refineWithClarifications(
  originalAnalysis: string,
  clarificationQA: Array<{ question: string; answer: string }>,
): Promise<RefinedAnalysis> {
  const qaText = clarificationQA
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  const prompt = REFINEMENT_PROMPT
    .replace("{originalAnalysis}", originalAnalysis)
    .replace("{clarificationQA}", qaText);

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt,
    temperature: 0.5,
    maxTokens: 2000,
  });

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned) as RefinedAnalysis;
}
