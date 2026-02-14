import type { Reinforcement, ReinforcementType } from "@clarity/types";

const MESSAGES: Record<ReinforcementType, string[]> = {
  completion: [
    "Crushed it! One step closer to your goal.",
    "Done and done! Momentum is building.",
    "That's the way! Keep this energy going.",
    "Another one in the books. You're on fire!",
    "Boom! Task complete. What's next?",
    "You just proved you can do hard things.",
    "Progress feels good, doesn't it?",
    "Small wins compound into massive results.",
    "Action beats perfection. Well done!",
    "You showed up and delivered. That's what winners do.",
  ],
  milestone: [
    "MILESTONE! You've hit {progress}% on your goal!",
    "Look at that progress — {progress}% complete! You're unstoppable.",
    "{progress}% done! The finish line is getting closer.",
    "Major milestone: {progress}%! Your consistency is paying off.",
    "You've reached {progress}%! Most people quit before this point.",
  ],
  streak: [
    "New streak record! {streakCount} days of consistent action!",
    "{streakCount} days in a row! You're building a powerful habit.",
    "Streak record broken: {streakCount} days! This is who you are now.",
    "{streakCount} consecutive days! Tony Robbins would be proud.",
  ],
  return: [
    "Welcome back! Ready to pick up where you left off?",
    "Great to see you again. Let's build on your progress!",
    "You came back — that's half the battle. Let's go!",
  ],
};

const recentlyUsed = new Map<ReinforcementType, Set<number>>();

export function getReinforcementMessage(
  type: ReinforcementType,
  context?: { progress?: number; streakCount?: number },
): Reinforcement {
  const pool = MESSAGES[type];
  if (!pool || pool.length === 0) {
    return { message: "Great job!", type };
  }

  // Track recently used to avoid repetition
  if (!recentlyUsed.has(type)) {
    recentlyUsed.set(type, new Set());
  }
  const used = recentlyUsed.get(type)!;

  // Reset if we've used most messages
  if (used.size >= pool.length - 1) {
    used.clear();
  }

  // Pick a random unused message
  let index: number;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (used.has(index));

  used.add(index);

  let message = pool[index]!;

  // Replace placeholders
  if (context?.progress !== undefined) {
    message = message.replace("{progress}", String(context.progress));
  }
  if (context?.streakCount !== undefined) {
    message = message.replace("{streakCount}", String(context.streakCount));
  }

  return { message, type };
}
