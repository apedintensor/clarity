import { Command } from "commander";
import {
  createCallerFactory,
  createContext,
  appRouter,
  parseSuggestions,
  stripSuggestionBlock,
  INBOX_CHAT_SYSTEM_PROMPT,
} from "@clarity/core";
import type { Suggestion } from "@clarity/core";
import { formatJson, printError, printInfo, printSuccess } from "../utils/output";
import { createPrompt, ask, confirm, readStdin } from "../utils/prompts";
import { resolveId } from "../utils/resolve-id";

const createCaller = createCallerFactory(appRouter);

interface ChatOptions {
  message?: string;
  stdin?: boolean;
  json?: boolean;
}

export function registerChatCommand(program: Command): void {
  program
    .command("chat [inboxItemId]")
    .description("Start an interactive brainstorm chat (optionally linked to an inbox item)")
    .option("--message <text>", "Send a single message without interactive mode")
    .option("--stdin", "Read message from standard input")
    .option("--json", "Output as JSON")
    .action(async (inboxItemId: string | undefined, opts: ChatOptions) => {
      const caller = createCaller(createContext());
      const user = await caller.user.getOrCreate();

      // Warn if both --message and --stdin provided
      if (opts.message && opts.stdin) {
        printInfo("Both --message and --stdin provided; using --message.");
      }

      let inboxItemText = "";
      let resolvedInboxId: string | null = null;
      let conversationId: string | null = null;
      // T021: Store persisted conversation messages for history loading
      // These messages are retrieved from the database via conversation.getOrCreate
      // and include all prior user and assistant messages in chronological order
      let persistedMessages: Array<{ role: string; content: string; createdAt: string }> = [];

      // If linked to an inbox item, load it and get/create conversation
      // This also loads the conversation history from the database
      if (inboxItemId) {
        try {
          resolvedInboxId = await resolveId(inboxItemId, "inbox");
          const items = await caller.inbox.list({ userId: user.id, status: "unprocessed" });
          const item = items.find((i) => i.id === resolvedInboxId);
          if (item) {
            inboxItemText = item.description ? `${item.title}\n\n${item.description}` : item.title;
            // Load conversation and its complete message history from database
            // The getOrCreate procedure returns { conversation, messages } where
            // messages are already sorted chronologically by createdAt timestamp
            const conv = await caller.conversation.getOrCreate({ inboxItemId: resolvedInboxId });
            conversationId = conv.conversation.id;
            persistedMessages = conv.messages; // These will be loaded into chatHistory
            if (!opts.json) printInfo(`Brainstorming: ${item.title}`);
          } else {
            printError(`Inbox item not found: ${inboxItemId}`);
            process.exit(1);
          }
        } catch (err) {
          printError(err instanceof Error ? err.message : "Failed to load inbox item");
          process.exit(1);
        }
      } else if (!opts.json) {
        printInfo("Starting a general brainstorm session. Type your thoughts and press Enter.");
      }

      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        printError("AI service is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in your .env file.");
        process.exit(1);
      }

      // Dynamic import for AI SDK (ESM)
      const { generateText } = await import("ai");
      const { google } = await import("@ai-sdk/google");

      const systemPrompt = inboxItemText
        ? `${INBOX_CHAT_SYSTEM_PROMPT}\n\nThe user's original thought from their inbox:\n"${inboxItemText}"\n\nStart by acknowledging their thought and engaging with it conversationally.`
        : INBOX_CHAT_SYSTEM_PROMPT;

      const chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

      // Determine the input message for non-interactive modes
      const nonInteractiveMessage = await resolveNonInteractiveInput(opts);

      if (nonInteractiveMessage !== null) {
        // Non-interactive mode: single exchange
        await handleSingleExchange({
          message: nonInteractiveMessage,
          caller,
          generateText,
          google,
          systemPrompt,
          chatHistory,
          conversationId,
          resolvedInboxId,
          persistedMessages,
          opts,
        });
        return;
      }

      // Interactive mode
      // T016: Load persisted conversation history for interactive mode (same as --message mode)
      try {
        const transformedMessages = persistedMessages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

        // T017: Consistent message transformation logic between modes
        chatHistory.push(...transformedMessages);

        if (transformedMessages.length > 0 && !opts.json) {
          printInfo(`Loaded ${transformedMessages.length} previous messages from conversation history.`);
        }
      } catch (err) {
        if (!opts.json) {
          printInfo("⚠ Could not load conversation history. Starting fresh.");
        }
      }

      const rl = createPrompt();
      if (!opts.json) console.log('  Type "quit" or "q" to exit.\n');

      try {
        let running = true;
        while (running) {
          const userInput = await ask(rl, "  You: ");

          // Empty string from ask() means EOF (piped input closed) or user quit
          if (!userInput || userInput === "quit" || userInput === "q") {
            running = false;
            if (!opts.json) printInfo("Chat ended.");
            break;
          }

          chatHistory.push({ role: "user", content: userInput });

          if (conversationId) {
            await caller.conversation.addMessage({
              conversationId,
              role: "user",
              content: userInput,
            });
          }

          try {
            const result = await generateText({
              model: google("gemini-2.0-flash"),
              system: systemPrompt,
              messages: chatHistory,
              temperature: 0.7,
              maxTokens: 1500,
            });

            const reply = result.text;
            chatHistory.push({ role: "assistant", content: reply });

            if (conversationId) {
              await caller.conversation.addMessage({
                conversationId,
                role: "assistant",
                content: reply,
              });
            }

            // Check for suggestions in the response
            const suggestions = parseSuggestions(reply);
            if (suggestions) {
              const cleanReply = stripSuggestionBlock(reply);
              if (cleanReply) console.log(`\n  AI: ${cleanReply}\n`);

              displaySuggestions(suggestions);

              // Prompt user to accept each suggestion
              for (const suggestion of suggestions) {
                const accepted = await confirm(rl, `  Accept goal "${suggestion.title}"?`);
                if (accepted) {
                  await acceptSuggestion({
                    caller,
                    suggestion,
                    inboxItemId: resolvedInboxId,
                    json: opts.json,
                  });
                }
              }
            } else {
              console.log(`\n  AI: ${reply}\n`);
            }
          } catch (err) {
            printError(err instanceof Error ? err.message : "AI response failed");
          }
        }
      } finally {
        rl.close();
      }
    });
}

/**
 * Determine the message for non-interactive mode.
 * Returns the message string, or null if interactive mode should be used.
 */
async function resolveNonInteractiveInput(opts: ChatOptions): Promise<string | null> {
  if (opts.message) {
    return opts.message;
  }
  if (opts.stdin) {
    return readStdin();
  }
  // Implicit piped mode: stdin is not a TTY and no explicit flags
  if (!process.stdin.isTTY) {
    return readStdin();
  }
  return null;
}

/**
 * Truncate conversation history to fit within token limits.
 * Uses a 4:1 character-to-token ratio for estimation.
 * Preserves recent messages (most relevant context) when truncating.
 *
 * @param messages - Array of conversation messages
 * @param systemPrompt - System prompt text
 * @param newUserMessage - The new user message to be sent
 * @param maxTokens - Maximum tokens allowed (default: 1000 for input context)
 * @returns Truncated message array that fits within token budget
 */
function truncateHistoryToTokenLimit(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string,
  newUserMessage: string,
  maxTokens: number = 1000 // Reserve ~1000 tokens for input (AI gets 1500 for output)
): { messages: Array<{ role: "user" | "assistant"; content: string }>; wasTruncated: boolean } {
  // T010: Character-to-token estimation (4:1 ratio)
  const CHARS_PER_TOKEN = 4;
  const maxChars = maxTokens * CHARS_PER_TOKEN;

  // Calculate current total characters
  const systemPromptChars = systemPrompt.length;
  const newMessageChars = newUserMessage.length;
  const fixedChars = systemPromptChars + newMessageChars;

  // If fixed content already exceeds limit, we have a problem
  if (fixedChars > maxChars) {
    // This shouldn't happen in practice, but if it does, return empty history
    return { messages: [], wasTruncated: true };
  }

  // Calculate budget for conversation history
  const historyBudget = maxChars - fixedChars;

  // T011: Implement oldest-first truncation while preserving recent context
  let currentChars = 0;
  const truncatedMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

  // Start from most recent messages and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const messageChars = messages[i]!.content.length;

    if (currentChars + messageChars <= historyBudget) {
      // Message fits in budget, prepend it (to maintain chronological order)
      truncatedMessages.unshift(messages[i]!);
      currentChars += messageChars;
    } else {
      // Budget exceeded, stop here (older messages are truncated)
      return { messages: truncatedMessages, wasTruncated: true };
    }
  }

  // All messages fit within budget
  return { messages: truncatedMessages, wasTruncated: false };
}

/**
 * Handle a single message exchange (non-interactive mode).
 * Loads persisted conversation history and includes it as context for the AI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSingleExchange(params: {
  message: string;
  caller: ReturnType<typeof createCaller>;
  generateText: (...args: any[]) => Promise<{ text: string }>;
  google: (model: string) => unknown;
  systemPrompt: string;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  conversationId: string | null;
  resolvedInboxId: string | null;
  persistedMessages: Array<{ role: string; content: string; createdAt: string }>;
  opts: ChatOptions;
}): Promise<void> {
  const {
    message,
    caller,
    generateText,
    google,
    systemPrompt,
    chatHistory,
    conversationId,
    persistedMessages,
    opts,
  } = params;

  // T005: Transform database messages to chatHistory format
  // Filter out system messages and map to { role, content } format
  let loadedMessageCount = 0;
  let wasTruncated = false;

  try {
    const transformedMessages = persistedMessages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    loadedMessageCount = transformedMessages.length;

    // T012: Apply token limit truncation to conversation history
    const truncationResult = truncateHistoryToTokenLimit(
      transformedMessages,
      systemPrompt,
      message
    );

    wasTruncated = truncationResult.wasTruncated;

    // T020: Debug logging for history loading and truncation
    if (loadedMessageCount > 0 && !opts.json) {
      console.error(`[DEBUG] Loaded ${loadedMessageCount} messages from history`);
      if (wasTruncated) {
        console.error(`[DEBUG] Truncated to ${truncationResult.messages.length} messages to fit token budget`);
      }
    }

    // T013: Add warning message when history is truncated
    if (wasTruncated && !opts.json) {
      printInfo("⚠ Conversation history truncated to fit token limits. Recent context preserved.");
    }

    // T006: Populate chatHistory array with transformed (and possibly truncated) messages
    chatHistory.push(...truncationResult.messages);
  } catch (err) {
    // T007: Error handling for message loading failures - graceful fallback
    if (!opts.json) {
      printInfo("⚠ Could not load conversation history. Proceeding with current message only.");
    }
    // chatHistory remains empty, proceed with just the new message
  }

  chatHistory.push({ role: "user", content: message });

  if (conversationId) {
    await caller.conversation.addMessage({
      conversationId,
      role: "user",
      content: message,
    });
  }

  try {
    const result = await generateText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages: chatHistory,
      temperature: 0.7,
      maxTokens: 1500,
    });

    const reply = result.text;
    chatHistory.push({ role: "assistant", content: reply });

    if (conversationId) {
      await caller.conversation.addMessage({
        conversationId,
        role: "assistant",
        content: reply,
      });
    }

    const suggestions = parseSuggestions(reply);
    const cleanReply = suggestions ? stripSuggestionBlock(reply) : reply;

    if (opts.json) {
      const output: Record<string, unknown> = { response: cleanReply };
      if (suggestions) {
        output.suggestions = suggestions;
      }
      // T019: Add conversation metadata to JSON output
      if (conversationId && loadedMessageCount > 0) {
        output.conversationContext = {
          messageCount: loadedMessageCount,
          conversationId,
          wasTruncated,
        };
      }
      console.log(formatJson(output));
    } else {
      if (cleanReply) console.log(`\n  AI: ${cleanReply}\n`);
      if (suggestions) {
        displaySuggestions(suggestions);
      }
    }
  } catch (err) {
    printError(err instanceof Error ? err.message : "AI response failed");
    process.exit(1);
  }
}

function displaySuggestions(suggestions: Suggestion[]): void {
  console.log("");
  suggestions.forEach((s, i) => {
    printInfo(`[${i + 1}] Goal: "${s.title}" (${s.tasks.length} tasks)`);
    console.log(`      Purpose: ${s.purpose}`);
    s.tasks.forEach((t) => {
      console.log(`      - ${t.title} (~${t.estimatedMinutes}min)`);
    });
  });
  console.log("");
}

async function acceptSuggestion(params: {
  caller: ReturnType<typeof createCaller>;
  suggestion: Suggestion;
  inboxItemId: string | null;
  json?: boolean;
}): Promise<void> {
  const { caller, suggestion, inboxItemId, json } = params;

  try {
    const result = await caller.inbox.acceptSuggestion({
      suggestion: {
        title: suggestion.title,
        purpose: suggestion.purpose,
        tasks: suggestion.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          estimatedMinutes: t.estimatedMinutes,
        })),
      },
      inboxItemId: inboxItemId ?? undefined,
    });

    if (json) {
      console.log(formatJson({ goalId: result.goalId, taskIds: result.taskIds }));
    } else {
      printSuccess(`Goal created (${result.goalId.slice(0, 8)}) with ${result.taskIds.length} tasks`);
      result.taskIds.forEach((tid) => {
        console.log(`    Task: ${tid.slice(0, 8)}`);
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to accept suggestion";
    if (message.includes("already processed") || message.includes("already been")) {
      printError("This inbox item has already been processed.");
    } else {
      printError(message);
    }
  }
}
