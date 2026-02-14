import { eq } from "drizzle-orm";
import { schema } from "@clarity/db";
import type { Database } from "@clarity/db";

export async function calculateStreak(db: Database): Promise<{ current: number; longest: number }> {
  const user = await db.query.users.findFirst();
  if (!user) return { current: 0, longest: 0 };

  return { current: user.currentStreak, longest: user.longestStreak };
}

export async function updateStreakForCompletion(
  db: Database,
): Promise<{ current: number; longest: number; isNewRecord: boolean }> {
  const user = await db.query.users.findFirst();
  if (!user) return { current: 0, longest: 0, isNewRecord: false };

  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;
  const now = new Date().toISOString();

  let newStreak: number;

  if (user.lastActiveDate === today) {
    // Already active today, no streak change
    return { current: user.currentStreak, longest: user.longestStreak, isNewRecord: false };
  } else if (user.lastActiveDate === yesterday) {
    // Consecutive day
    newStreak = user.currentStreak + 1;
  } else {
    // Streak broken or first activity
    newStreak = 1;
  }

  const newLongest = Math.max(user.longestStreak, newStreak);
  const isNewRecord = newStreak > user.longestStreak;

  await db
    .update(schema.users)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      updatedAt: now,
    })
    .where(eq(schema.users.id, user.id));

  return { current: newStreak, longest: newLongest, isNewRecord };
}
