export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  defaultTimerMinutes?: number;
  celebrationStyle?: "minimal" | "standard" | "enthusiastic";
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  geminiApiKey: string | null;
  preferences: UserPreferences;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  preferences: UserPreferences;
}
