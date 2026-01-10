export interface Fast {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in minutes
  status: "active" | "completed";
  notes?: string;
  protocol?: string;
  mood?: number; // 1-5 scale
  energyLevel?: number; // 1-5 scale
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface FastGoal {
  type: "daily" | "weekly";
  targetHours: number;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  unit: "kg" | "lbs";
}

export interface FastingSchedule {
  enabled: boolean;
  eatingWindowStart: string;
  eatingWindowEnd: string;
  fastingHours: number;
  remindersBefore: number;
}

export interface UserProfile {
  dailyGoal: number;
  weeklyGoal: number;
  preferredProtocol: string;
  startingWeight?: number;
  currentWeight?: number;
  targetWeight?: number;
  weightUnit: "kg" | "lbs";
  onboardingComplete: boolean;
  createdAt: string;
  schedule?: FastingSchedule;
  achievements?: string[];
}

export interface Protocol {
  id: string;
  name: string;
  fastingHours: number;
  eatingHours: number;
  description: string;
  isCustom?: boolean;
}

export interface CustomProtocol extends Protocol {
  isCustom: true;
  createdAt: string;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: "16:8",
    name: "16:8",
    fastingHours: 16,
    eatingHours: 8,
    description: "Most popular. Fast 16 hours, eat within 8.",
  },
  {
    id: "18:6",
    name: "18:6",
    fastingHours: 18,
    eatingHours: 6,
    description: "Intermediate. Fast 18 hours, eat within 6.",
  },
  {
    id: "20:4",
    name: "20:4",
    fastingHours: 20,
    eatingHours: 4,
    description: "Advanced. Fast 20 hours, eat within 4.",
  },
  {
    id: "omad",
    name: "OMAD",
    fastingHours: 23,
    eatingHours: 1,
    description: "One meal a day. Maximum autophagy.",
  },
  {
    id: "water",
    name: "Water Fast",
    fastingHours: 24,
    eatingHours: 0,
    description: "24+ hour water-only fast. Deep cellular renewal.",
  },
  {
    id: "custom",
    name: "Custom",
    fastingHours: 0,
    eatingHours: 0,
    description: "Set your own fasting window.",
  },
];

export interface FastingZone {
  minHours: number;
  maxHours: number;
  name: string;
  description: string;
  color: string;
}

export const FASTING_ZONES: FastingZone[] = [
  {
    minHours: 0,
    maxHours: 4,
    name: "Fed State",
    description: "Body is digesting your last meal",
    color: "#6B6B6B",
  },
  {
    minHours: 4,
    maxHours: 8,
    name: "Early Fasting",
    description: "Blood sugar and insulin dropping",
    color: "#9A9A9E",
  },
  {
    minHours: 8,
    maxHours: 12,
    name: "Fat Burning",
    description: "Body switching to fat for fuel",
    color: "#F5F5F5",
  },
  {
    minHours: 12,
    maxHours: 18,
    name: "Ketosis",
    description: "Producing ketones, mental clarity increases",
    color: "#4ADE80",
  },
  {
    minHours: 18,
    maxHours: 24,
    name: "Deep Ketosis",
    description: "Autophagy begins, cellular cleanup",
    color: "#22C55E",
  },
  {
    minHours: 24,
    maxHours: 999,
    name: "Extended Fast",
    description: "Maximum autophagy and growth hormone",
    color: "#16A34A",
  },
];

// Achievement Types
export type AchievementCategory =
  | "general"
  | "16:8"
  | "18:6"
  | "20:4"
  | "omad"
  | "water"
  | "streak"
  | "milestone"
  | "special";
export type AchievementTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "adamantium";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirement: {
    type:
      | "streak"
      | "total_fasts"
      | "total_hours"
      | "single_fast"
      | "protocol_count"
      | "protocol_streak"
      | "all_achievements";
    value: number;
    protocol?: string;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // === GENERAL ACHIEVEMENTS ===
  {
    id: "first_fast",
    name: "First Step",
    description: "Complete your first fast",
    category: "general",
    tier: "bronze",
    requirement: { type: "total_fasts", value: 1 },
  },
  {
    id: "ten_fasts",
    name: "Building Habits",
    description: "Complete 10 fasts",
    category: "general",
    tier: "bronze",
    requirement: { type: "total_fasts", value: 10 },
  },
  {
    id: "twenty_five_fasts",
    name: "Committed",
    description: "Complete 25 fasts",
    category: "general",
    tier: "silver",
    requirement: { type: "total_fasts", value: 25 },
  },
  {
    id: "fifty_fasts",
    name: "Dedicated",
    description: "Complete 50 fasts",
    category: "general",
    tier: "silver",
    requirement: { type: "total_fasts", value: 50 },
  },
  {
    id: "hundred_fasts",
    name: "Centurion",
    description: "Complete 100 fasts",
    category: "general",
    tier: "gold",
    requirement: { type: "total_fasts", value: 100 },
  },
  {
    id: "two_fifty_fasts",
    name: "Veteran",
    description: "Complete 250 fasts",
    category: "general",
    tier: "platinum",
    requirement: { type: "total_fasts", value: 250 },
  },

  // === STREAK ACHIEVEMENTS ===
  {
    id: "streak_3",
    name: "Momentum",
    description: "3-day streak",
    category: "streak",
    tier: "bronze",
    requirement: { type: "streak", value: 3 },
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day streak",
    category: "streak",
    tier: "bronze",
    requirement: { type: "streak", value: 7 },
  },
  {
    id: "streak_14",
    name: "Fortnight",
    description: "14-day streak",
    category: "streak",
    tier: "silver",
    requirement: { type: "streak", value: 14 },
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "30-day streak",
    category: "streak",
    tier: "gold",
    requirement: { type: "streak", value: 30 },
  },
  {
    id: "streak_60",
    name: "Iron Will",
    description: "60-day streak",
    category: "streak",
    tier: "gold",
    requirement: { type: "streak", value: 60 },
  },
  {
    id: "streak_100",
    name: "Unstoppable",
    description: "100-day streak",
    category: "streak",
    tier: "platinum",
    requirement: { type: "streak", value: 100 },
  },

  // === MILESTONE ACHIEVEMENTS ===
  {
    id: "hours_50",
    name: "Half Century",
    description: "50 total hours fasted",
    category: "milestone",
    tier: "bronze",
    requirement: { type: "total_hours", value: 50 },
  },
  {
    id: "hours_100",
    name: "Century Club",
    description: "100 total hours fasted",
    category: "milestone",
    tier: "silver",
    requirement: { type: "total_hours", value: 100 },
  },
  {
    id: "hours_500",
    name: "Elite",
    description: "500 total hours fasted",
    category: "milestone",
    tier: "gold",
    requirement: { type: "total_hours", value: 500 },
  },
  {
    id: "hours_1000",
    name: "Time Lord",
    description: "1000 total hours fasted",
    category: "milestone",
    tier: "platinum",
    requirement: { type: "total_hours", value: 1000 },
  },
  {
    id: "single_24",
    name: "Full Day",
    description: "Complete a 24-hour fast",
    category: "milestone",
    tier: "silver",
    requirement: { type: "single_fast", value: 24 * 60 },
  },
  {
    id: "single_36",
    name: "Extended",
    description: "Complete a 36-hour fast",
    category: "milestone",
    tier: "gold",
    requirement: { type: "single_fast", value: 36 * 60 },
  },
  {
    id: "single_48",
    name: "Marathon",
    description: "Complete a 48-hour fast",
    category: "milestone",
    tier: "platinum",
    requirement: { type: "single_fast", value: 48 * 60 },
  },

  // === 16:8 PROTOCOL ACHIEVEMENTS ===
  {
    id: "16_8_first",
    name: "16:8 Initiate",
    description: "Complete your first 16:8 fast",
    category: "16:8",
    tier: "bronze",
    requirement: { type: "protocol_count", value: 1, protocol: "16:8" },
  },
  {
    id: "16_8_10",
    name: "16:8 Regular",
    description: "Complete 10 fasts with 16:8",
    category: "16:8",
    tier: "bronze",
    requirement: { type: "protocol_count", value: 10, protocol: "16:8" },
  },
  {
    id: "16_8_25",
    name: "16:8 Practitioner",
    description: "Complete 25 fasts with 16:8",
    category: "16:8",
    tier: "silver",
    requirement: { type: "protocol_count", value: 25, protocol: "16:8" },
  },
  {
    id: "16_8_50",
    name: "16:8 Expert",
    description: "Complete 50 fasts with 16:8",
    category: "16:8",
    tier: "gold",
    requirement: { type: "protocol_count", value: 50, protocol: "16:8" },
  },
  {
    id: "16_8_streak_7",
    name: "16:8 Week",
    description: "7-day streak with 16:8",
    category: "16:8",
    tier: "silver",
    requirement: { type: "protocol_streak", value: 7, protocol: "16:8" },
  },
  {
    id: "16_8_streak_30",
    name: "16:8 Master",
    description: "30-day streak with 16:8",
    category: "16:8",
    tier: "platinum",
    requirement: { type: "protocol_streak", value: 30, protocol: "16:8" },
  },

  // === 18:6 PROTOCOL ACHIEVEMENTS ===
  {
    id: "18_6_first",
    name: "18:6 Initiate",
    description: "Complete your first 18:6 fast",
    category: "18:6",
    tier: "bronze",
    requirement: { type: "protocol_count", value: 1, protocol: "18:6" },
  },
  {
    id: "18_6_10",
    name: "18:6 Regular",
    description: "Complete 10 fasts with 18:6",
    category: "18:6",
    tier: "bronze",
    requirement: { type: "protocol_count", value: 10, protocol: "18:6" },
  },
  {
    id: "18_6_25",
    name: "18:6 Practitioner",
    description: "Complete 25 fasts with 18:6",
    category: "18:6",
    tier: "silver",
    requirement: { type: "protocol_count", value: 25, protocol: "18:6" },
  },
  {
    id: "18_6_50",
    name: "18:6 Expert",
    description: "Complete 50 fasts with 18:6",
    category: "18:6",
    tier: "gold",
    requirement: { type: "protocol_count", value: 50, protocol: "18:6" },
  },
  {
    id: "18_6_streak_7",
    name: "18:6 Week",
    description: "7-day streak with 18:6",
    category: "18:6",
    tier: "silver",
    requirement: { type: "protocol_streak", value: 7, protocol: "18:6" },
  },
  {
    id: "18_6_streak_30",
    name: "18:6 Master",
    description: "30-day streak with 18:6",
    category: "18:6",
    tier: "platinum",
    requirement: { type: "protocol_streak", value: 30, protocol: "18:6" },
  },

  // === 20:4 PROTOCOL ACHIEVEMENTS ===
  {
    id: "20_4_first",
    name: "20:4 Initiate",
    description: "Complete your first 20:4 fast",
    category: "20:4",
    tier: "bronze",
    requirement: { type: "protocol_count", value: 1, protocol: "20:4" },
  },
  {
    id: "20_4_10",
    name: "20:4 Regular",
    description: "Complete 10 fasts with 20:4",
    category: "20:4",
    tier: "silver",
    requirement: { type: "protocol_count", value: 10, protocol: "20:4" },
  },
  {
    id: "20_4_25",
    name: "20:4 Warrior",
    description: "Complete 25 fasts with 20:4",
    category: "20:4",
    tier: "gold",
    requirement: { type: "protocol_count", value: 25, protocol: "20:4" },
  },
  {
    id: "20_4_50",
    name: "20:4 Elite",
    description: "Complete 50 fasts with 20:4",
    category: "20:4",
    tier: "platinum",
    requirement: { type: "protocol_count", value: 50, protocol: "20:4" },
  },
  {
    id: "20_4_streak_7",
    name: "20:4 Week",
    description: "7-day streak with 20:4",
    category: "20:4",
    tier: "gold",
    requirement: { type: "protocol_streak", value: 7, protocol: "20:4" },
  },

  // === OMAD PROTOCOL ACHIEVEMENTS ===
  {
    id: "omad_first",
    name: "OMAD Initiate",
    description: "Complete your first OMAD fast",
    category: "omad",
    tier: "silver",
    requirement: { type: "protocol_count", value: 1, protocol: "omad" },
  },
  {
    id: "omad_10",
    name: "OMAD Warrior",
    description: "Complete 10 OMAD fasts",
    category: "omad",
    tier: "gold",
    requirement: { type: "protocol_count", value: 10, protocol: "omad" },
  },
  {
    id: "omad_25",
    name: "OMAD Elite",
    description: "Complete 25 OMAD fasts",
    category: "omad",
    tier: "platinum",
    requirement: { type: "protocol_count", value: 25, protocol: "omad" },
  },
  {
    id: "omad_streak_7",
    name: "OMAD Week",
    description: "7-day streak with OMAD",
    category: "omad",
    tier: "platinum",
    requirement: { type: "protocol_streak", value: 7, protocol: "omad" },
  },

  // === WATER FAST PROTOCOL ACHIEVEMENTS ===
  {
    id: "water_first",
    name: "Water Initiate",
    description: "Complete your first water fast",
    category: "water",
    tier: "silver",
    requirement: { type: "protocol_count", value: 1, protocol: "water" },
  },
  {
    id: "water_5",
    name: "Hydration Hero",
    description: "Complete 5 water fasts",
    category: "water",
    tier: "gold",
    requirement: { type: "protocol_count", value: 5, protocol: "water" },
  },
  {
    id: "water_10",
    name: "Aqua Master",
    description: "Complete 10 water fasts",
    category: "water",
    tier: "gold",
    requirement: { type: "protocol_count", value: 10, protocol: "water" },
  },
  {
    id: "water_25",
    name: "Water Sage",
    description: "Complete 25 water fasts",
    category: "water",
    tier: "platinum",
    requirement: { type: "protocol_count", value: 25, protocol: "water" },
  },
  {
    id: "water_36h",
    name: "Deep Dive",
    description: "Complete a 36-hour water fast",
    category: "water",
    tier: "gold",
    requirement: { type: "single_fast", value: 36 * 60 },
  },
  {
    id: "water_48h",
    name: "Water Warrior",
    description: "Complete a 48-hour water fast",
    category: "water",
    tier: "platinum",
    requirement: { type: "single_fast", value: 48 * 60 },
  },
  {
    id: "water_72h",
    name: "Purification",
    description: "Complete a 72-hour water fast",
    category: "water",
    tier: "platinum",
    requirement: { type: "single_fast", value: 72 * 60 },
  },

  // === SPECIAL ACHIEVEMENTS ===
  {
    id: "completionist",
    name: "Completionist",
    description: "Unlock all other achievements",
    category: "special",
    tier: "adamantium",
    requirement: { type: "all_achievements", value: 1 },
  },
];

// Achievement category display info
export const ACHIEVEMENT_CATEGORIES: Record<
  AchievementCategory,
  { name: string; description: string }
> = {
  general: { name: "General", description: "Core fasting achievements" },
  streak: { name: "Streaks", description: "Consistency achievements" },
  milestone: { name: "Milestones", description: "Time-based achievements" },
  "16:8": {
    name: "16:8 Protocol",
    description: "16-hour fasting achievements",
  },
  "18:6": {
    name: "18:6 Protocol",
    description: "18-hour fasting achievements",
  },
  "20:4": {
    name: "20:4 Protocol",
    description: "20-hour fasting achievements",
  },
  omad: { name: "OMAD Protocol", description: "One meal a day achievements" },
  water: {
    name: "Water Fast",
    description: "Extended water fasting achievements",
  },
  special: { name: "Special", description: "Legendary achievements" },
};

// Tier display info
export const ACHIEVEMENT_TIERS: Record<
  AchievementTier,
  { name: string; color: string; bgColor: string }
> = {
  bronze: {
    name: "Bronze",
    color: "#CD7F32",
    bgColor: "rgba(205, 127, 50, 0.15)",
  },
  silver: {
    name: "Silver",
    color: "#C0C0C0",
    bgColor: "rgba(192, 192, 192, 0.15)",
  },
  gold: { name: "Gold", color: "#FFD700", bgColor: "rgba(255, 215, 0, 0.15)" },
  platinum: {
    name: "Platinum",
    color: "#E5E4E2",
    bgColor: "rgba(229, 228, 226, 0.2)",
  },
  adamantium: {
    name: "Adamantium",
    color: "#00FFFF",
    bgColor: "rgba(0, 255, 255, 0.15)",
  },
};
