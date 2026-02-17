"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { trpc } from "@/lib/trpc";
import { Modal } from "./modal";
import { AISuggestionCard, parseSuggestions, removeSuggestionBlock } from "./ai-suggestion-card";
import type { AISuggestion } from "./ai-suggestion-card";
import type { InboxItem } from "@clarity/types";

interface InboxChatModalProps {
  item: InboxItem;
  onClose: () => void;
  onUpdate: () => void;
}

export function InboxChatModal({ item, onClose, onUpdate }: InboxChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<number>>(new Set());
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());

  const getOrCreate = trpc.conversation.getOrCreate.useMutation();
  const saveAssistant = trpc.conversation.saveAssistantMessage.useMutation();
  const addUserMessage = trpc.conversation.addMessage.useMutation();
  const acceptSuggestion = trpc.inbox.acceptSuggestion.useMutation({
    onSuccess: () => onUpdate(),
  });

  const inboxItemText = item.description
    ? `${item.title}\n\n${item.description}`
    : item.title;

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    api: "/api/chat",
    body: { inboxItemText },
    onFinish: (message) => {
      if (conversationId) {
        saveAssistant.mutate({
          conversationId,
          content: message.content,
        });
      }
    },
  });

  // Load existing conversation
  useEffect(() => {
    if (loaded) return;

    let cancelled = false;
    getOrCreate.mutate(
      { inboxItemId: item.id },
      {
        onSuccess: (data) => {
          if (cancelled) return;
          setConversationId(data.conversation.id);
          if (data.messages.length > 0) {
            setMessages(
              data.messages.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            );
          }
          setLoaded(true);
        },
        onError: (err) => {
          if (cancelled) return;
          console.error("Failed to load conversation:", err);
          setLoaded(true);
        },
      },
    );

    return () => { cancelled = true; };
  }, [item.id, loaded]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when loaded
  useEffect(() => {
    if (loaded) textareaRef.current?.focus();
  }, [loaded]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 20;
    const maxHeight = lineHeight * 6 + 16; // ~6 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      // Save user message to DB
      if (conversationId) {
        addUserMessage.mutate({
          conversationId,
          role: "user",
          content: input.trim(),
        });
      }

      handleSubmit(e);
    },
    [input, isLoading, conversationId, addUserMessage, handleSubmit],
  );

  const handleAcceptSuggestion = useCallback(
    (suggestion: AISuggestion, globalIdx: number) => {
      acceptSuggestion.mutate({
        suggestion,
      });
      setAcceptedSuggestions((prev) => new Set([...prev, globalIdx]));
    },
    [acceptSuggestion],
  );

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        {/* Header */}
        <div className="border-b border-[var(--border)] pb-3 mb-3">
          <h2 className="text-lg font-bold">Brainstorm</h2>
          <p className="text-sm text-[var(--muted)] truncate">{item.title}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 && loaded && (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--muted)]">
                Start a conversation to brainstorm and expand this idea.
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                Ask the AI to help you think deeper, challenge assumptions, or suggest goals.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const suggestions = msg.role === "assistant" ? parseSuggestions(msg.content) : [];
            const cleanContent = msg.role === "assistant" ? removeSuggestionBlock(msg.content) : msg.content;

            return (
              <div key={msg.id ?? idx} className="space-y-2">
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-white ml-8"
                      : "bg-[var(--bg-secondary,var(--border))] mr-8"
                  }`}
                >
                  {cleanContent && (
                    <div className="whitespace-pre-wrap">{cleanContent}</div>
                  )}
                </div>

                {suggestions.length > 0 &&
                  suggestions.map((suggestion, sIdx) => {
                    const globalIdx = idx * 100 + sIdx;
                    if (rejectedSuggestions.has(globalIdx)) return null;
                    const isAccepted = acceptedSuggestions.has(globalIdx);
                    return (
                      <AISuggestionCard
                        key={sIdx}
                        suggestion={suggestion}
                        accepted={isAccepted}
                        onAccept={(s) => handleAcceptSuggestion(s, globalIdx)}
                        onReject={() =>
                          setRejectedSuggestions((prev) => new Set([...prev, globalIdx]))
                        }
                      />
                    );
                  })}
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="bg-[var(--bg-secondary,var(--border))] rounded-lg px-3 py-2 text-sm mr-8">
              <span className="animate-pulse">Thinking...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-500 mr-8">
              Failed to get AI response. {error.message || "Please try again."}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleFormSubmit} className="border-t border-[var(--border)] pt-3 mt-3 flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              handleInputChange(e);
              autoResize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e);
              }
            }}
            placeholder="Type a message... (Shift+Enter for new line)"
            rows={1}
            className="flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] resize-none overflow-y-auto leading-5"
            style={{ maxHeight: "136px" }}
            disabled={!loaded || isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !loaded}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </Modal>
  );
}
