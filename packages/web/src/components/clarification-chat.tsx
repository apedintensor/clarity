"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { Clarification } from "@clarity/types";

interface ClarificationChatProps {
  clarifications: Clarification[];
  onComplete: () => void;
}

export function ClarificationChat({ clarifications, onComplete }: ClarificationChatProps) {
  const answerMutation = trpc.clarification.answer.useMutation({ onSuccess: onComplete });
  const skipMutation = trpc.clarification.skip.useMutation({ onSuccess: onComplete });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const pending = clarifications.filter((c) => c.status === "pending");
  const answered = clarifications.filter((c) => c.status !== "pending");

  if (pending.length === 0 && answered.length > 0) {
    return (
      <div className="rounded-lg border border-[var(--success)] bg-[var(--success)]/10 p-4 text-center text-sm text-[var(--success)]">
        All clarifications resolved!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--muted)]">Clarification Questions</h2>

      {/* Answered */}
      {answered.map((c) => (
        <div key={c.id} className="rounded-lg border border-[var(--border)] p-4 opacity-70">
          <p className="text-sm font-medium">{c.question}</p>
          <p className="mt-1 text-sm text-[var(--success)]">
            {c.status === "skipped" ? "Skipped" : c.userAnswer}
          </p>
        </div>
      ))}

      {/* Pending */}
      {pending.map((c) => (
        <div key={c.id} className="rounded-lg border border-[var(--accent)] p-4">
          <p className="text-sm font-medium">{c.question}</p>
          {c.suggestedAnswers && c.suggestedAnswers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {c.suggestedAnswers.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [c.id]: suggestion }))}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    answers[c.id] === suggestion
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] hover:border-[var(--accent)]"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={answers[c.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [c.id]: e.target.value }))}
              placeholder="Type your answer..."
              className="flex-1 rounded border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => answers[c.id] && answerMutation.mutate({ id: c.id, answer: answers[c.id]! })}
              disabled={!answers[c.id] || answerMutation.isPending}
              className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs text-white disabled:opacity-50"
            >
              Answer
            </button>
            <button
              onClick={() => skipMutation.mutate({ id: c.id })}
              disabled={skipMutation.isPending}
              className="rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]"
            >
              Skip
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
