import { z } from "zod";

const suggestionTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  estimatedMinutes: z.number().min(5).max(120).default(30),
});

const suggestionSchema = z.object({
  title: z.string().min(1),
  purpose: z.string().min(1),
  tasks: z.array(suggestionTaskSchema),
});

export type Suggestion = z.infer<typeof suggestionSchema>;
export type SuggestionTask = z.infer<typeof suggestionTaskSchema>;

const SUGGESTION_BLOCK_RE = /---SUGGESTIONS---\s*([\s\S]*?)\s*---END_SUGGESTIONS---/;

/**
 * Parse AI response text for structured suggestion blocks.
 * Returns an array of validated suggestions, or null if none found or parsing fails.
 */
export function parseSuggestions(text: string): Suggestion[] | null {
  const match = SUGGESTION_BLOCK_RE.exec(text);
  if (!match?.[1]) return null;

  try {
    const parsed: unknown = JSON.parse(match[1]);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const validated = arr.map((item) => suggestionSchema.parse(item));
    return validated.length > 0 ? validated : null;
  } catch {
    return null;
  }
}

/**
 * Strip the raw suggestion block markers from AI response text,
 * leaving only the conversational parts.
 */
export function stripSuggestionBlock(text: string): string {
  return text.replace(SUGGESTION_BLOCK_RE, "").trim();
}
