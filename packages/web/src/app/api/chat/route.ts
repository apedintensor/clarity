import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const dynamic = "force-dynamic";

const INBOX_CHAT_SYSTEM_PROMPT = `You are a personal growth coach and brainstorming partner, inspired by Tony Robbins' RPM framework and cognitive psychology principles.

Your role is to help the user think through their ideas deeply and turn them into actionable goals and tasks.

How you should interact:
1. **Ask clarifying questions** — Help the user explore their idea more deeply. What do they really want? Why does it matter?
2. **Expand on ideas** — Suggest possibilities they haven't considered. Connect their idea to bigger themes in their life.
3. **Challenge limiting beliefs** — Gently and empathetically question assumptions like "I can't", "I don't have time", "It's too late". Reframe them constructively.
4. **Be realistic while encouraging** — Help them set achievable milestones. Don't dismiss ambition, but help break big dreams into manageable steps.
5. **Align with personal growth** — Connect their ideas to becoming a better version of themselves.

When the user asks you to suggest or generate goals, respond with a structured suggestion block. Format it EXACTLY like this (the system will parse it):

---SUGGESTIONS---
[
  {
    "title": "Clear, action-oriented goal title",
    "purpose": "Why this matters — the emotional driver",
    "tasks": [
      {
        "title": "Specific actionable task",
        "description": "Brief context about what this involves",
        "estimatedMinutes": 30
      }
    ]
  }
]
---END_SUGGESTIONS---

Include the suggestion block naturally within your response. You can add commentary before or after it.

When the user asks you to search online, research something, or look up information, use the googleSearch tool to find relevant results and incorporate them into your response. Always cite your sources when using search results.

Rules:
- Keep responses conversational and warm, not robotic
- Don't generate suggestions until the user explicitly asks for them or says they're ready
- Each goal should have 3-7 tasks
- Tasks should be completable in 25-90 minutes each
- Be concise but thoughtful — aim for 2-4 paragraphs in regular conversation
- If the idea is vague, ask questions first before suggesting goals
- When providing search results, include source references`;

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env file." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const { messages, inboxItemText } = await req.json() as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      inboxItemText: string;
    };

    const systemMessage = {
      role: "system" as const,
      content: `${INBOX_CHAT_SYSTEM_PROMPT}\n\nThe user's original thought from their inbox:\n"${inboxItemText}"\n\nStart by acknowledging their thought and engaging with it conversationally.`,
    };

    const result = streamText({
      model: google("gemini-2.0-flash", {
        useSearchGrounding: true,
      }),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
