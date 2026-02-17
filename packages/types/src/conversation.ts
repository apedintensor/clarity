export type ConversationMessageRole = "user" | "assistant" | "system";

export interface Conversation {
  id: string;
  userId: string;
  inboxItemId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  createdAt: string;
}
