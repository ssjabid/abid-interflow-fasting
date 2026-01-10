import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface LeaderboardEntry {
  odId: string;
  displayName: string;
  totalFasts: number;
  totalHours: number;
  currentStreak: number;
  bestStreak: number;
  longestFast: number;
  lastUpdated: Date;
  joinedAt: Date;
  isPublic: boolean;
}

export type LeaderboardCategory =
  | "totalHours"
  | "totalFasts"
  | "currentStreak"
  | "longestFast";

const LEADERBOARD_COLLECTION = "leaderboard";

export async function updateLeaderboardEntry(
  odId: string,
  data: Omit<LeaderboardEntry, "odId" | "lastUpdated">
): Promise<void> {
  try {
    const docRef = doc(db, LEADERBOARD_COLLECTION, odId);
    await setDoc(
      docRef,
      {
        ...data,
        odId,
        lastUpdated: Timestamp.now(),
        joinedAt: data.joinedAt
          ? Timestamp.fromDate(data.joinedAt)
          : Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    // Don't throw - fail silently to not break the app
  }
}

export async function getLeaderboard(
  category: LeaderboardCategory,
  limitCount: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      where("isPublic", "==", true),
      orderBy(category, "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...d.data(),
      odId: d.id,
      lastUpdated: d.data().lastUpdated?.toDate?.() || new Date(),
      joinedAt: d.data().joinedAt?.toDate?.() || new Date(),
    })) as LeaderboardEntry[];
  } catch (error: any) {
    // Check if it's an index error
    if (
      error?.code === "failed-precondition" ||
      error?.message?.includes("index")
    ) {
      console.warn(
        `Leaderboard index needed for ${category}. Please create the index in Firebase Console.`
      );
    } else {
      console.error("Error fetching leaderboard:", error);
    }
    return [];
  }
}

export async function getUserRank(
  odId: string,
  category: LeaderboardCategory
): Promise<number | null> {
  try {
    const leaderboard = await getLeaderboard(category, 1000);
    const index = leaderboard.findIndex((entry) => entry.odId === odId);
    return index >= 0 ? index + 1 : null;
  } catch (error) {
    console.error("Error getting user rank:", error);
    return null;
  }
}

export function calculateLeaderboardStats(
  fasts: any[],
  profile: any
): Omit<LeaderboardEntry, "odId" | "lastUpdated"> {
  const completedFasts = fasts.filter((f) => f.status === "completed");

  const totalFasts = completedFasts.length;
  const totalHours = Math.round(
    completedFasts.reduce((sum, f) => sum + f.duration, 0) / 60
  );
  const longestFast =
    completedFasts.length > 0
      ? Math.max(...completedFasts.map((f) => f.duration))
      : 0;

  const sortedFasts = [...completedFasts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (const fast of sortedFasts) {
    const fastDate = new Date(fast.startTime);
    fastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (checkDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      tempStreak++;
      checkDate = fastDate;
      if (currentStreak === 0) currentStreak = tempStreak;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
      checkDate = fastDate;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return {
    displayName: profile.displayName || "Anonymous Faster",
    totalFasts,
    totalHours,
    currentStreak,
    bestStreak,
    longestFast,
    joinedAt: profile.createdAt ? new Date(profile.createdAt) : new Date(),
    isPublic: profile.leaderboardOptIn ?? false,
  };
}
