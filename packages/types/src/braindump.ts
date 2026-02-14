export type BrainDumpStatus = "raw" | "processing" | "organized" | "error";

export interface BrainDump {
  id: string;
  userId: string;
  rawText: string;
  status: BrainDumpStatus;
  aiSummary: string | null;
  themes: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrainDumpWithRelations extends BrainDump {
  clarifications: Clarification[];
  goals: Goal[];
}

export interface CreateBrainDumpInput {
  rawText: string;
}

export interface UpdateBrainDumpInput {
  id: string;
  appendText?: string;
  aiSummary?: string;
}

export interface ListBrainDumpsInput {
  limit?: number;
  cursor?: string;
}

export interface ListBrainDumpsOutput {
  items: BrainDump[];
  nextCursor: string | undefined;
}

// Re-export related types used in BrainDumpWithRelations
import type { Clarification } from "./clarification.js";
import type { Goal } from "./goal.js";
