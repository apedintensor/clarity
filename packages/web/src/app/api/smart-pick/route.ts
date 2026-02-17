import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const dynamic = "force-dynamic";

interface TaskInput {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number;
  goalTitle: string;
  goalPurpose: string;
  goalProgress: number;
  isCarryForward: boolean;
}

interface SmartPickResult {
  taskId: string;
  reason: string;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const { tasks, focusThresholdMinutes } = (await req.json()) as {
      tasks: TaskInput[];
      focusThresholdMinutes: number;
    };

    if (!tasks || tasks.length === 0) {
      return Response.json({ picks: [], message: "No tasks available." });
    }

    const taskList = tasks
      .map(
        (t, i) =>
          `${i + 1}. [ID: ${t.id}] "${t.title}" (${t.estimatedMinutes}min) — Goal: "${t.goalTitle}" (${t.goalProgress}% done, purpose: ${t.goalPurpose})${t.isCarryForward ? " [CARRIED FROM YESTERDAY]" : ""}${t.description ? ` — ${t.description}` : ""}`,
      )
      .join("\n");

    const prompt = `You are a productivity coach. The user has ${focusThresholdMinutes} minutes of focus time today.

Here are their available tasks:
${taskList}

Select the best tasks for today that fit within ${focusThresholdMinutes} minutes total. Prioritize:
1. Tasks carried forward from yesterday (unfinished business)
2. Tasks on goals with low progress (below 30%) that need attention
3. Quick wins (shorter tasks) to build momentum early
4. Balanced distribution across goals — don't neglect any active goal
5. Tasks on goals with clear purpose alignment

For each selected task, provide a SHORT reason (under 10 words) explaining why.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "picks": [
    { "taskId": "<task id>", "reason": "<short reason>" }
  ]
}`;

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
    });

    const text = result.text.trim();
    // Extract JSON from potential markdown code block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ picks: [], message: "AI returned unexpected format." });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { picks: SmartPickResult[] };

    // Validate that all taskIds exist in the input
    const validIds = new Set(tasks.map((t) => t.id));
    const validPicks = parsed.picks.filter((p) => validIds.has(p.taskId));

    return Response.json({ picks: validPicks });
  } catch (error) {
    console.error("Smart pick error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate recommendations." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
