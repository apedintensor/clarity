export type ClarificationStatus = "pending" | "answered" | "skipped";

export interface Clarification {
  id: string;
  brainDumpId: string;
  question: string;
  suggestedAnswers: string[] | null;
  userAnswer: string | null;
  status: ClarificationStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerClarificationInput {
  id: string;
  answer: string;
}

export interface AnswerAllClarificationsInput {
  answers: { id: string; answer: string }[];
}
