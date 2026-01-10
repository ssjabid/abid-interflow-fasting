import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Fast, UserProfile } from "../types";
import { ACHIEVEMENTS } from "../types";

interface AchievementContextType {
  checkForNewAchievements: (fasts: Fast[], profile: UserProfile) => string[];
  pendingUnlock: string | null;
  dismissUnlock: () => void;
}

const AchievementContext = createContext<AchievementContextType | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [pendingUnlock, setPendingUnlock] = useState<string | null>(null);

  const dismissUnlock = () => {
    setPendingUnlock(null);
  };

  const checkForNewAchievements = (
    fasts: Fast[],
    profile: UserProfile
  ): string[] => {
    const completedFasts = fasts.filter((f) => f.status === "completed");
    const currentAchievements = profile.achievements || [];
    const newUnlocks: string[] = [];

    const totalFasts = completedFasts.length;
    const totalHours =
      completedFasts.reduce((sum, f) => sum + f.duration, 0) / 60;

    // Calculate streak
    const sortedFasts = [...completedFasts].sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const fast of sortedFasts) {
      const fastDate = new Date(fast.startTime);
      fastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (checkDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 1) {
        currentStreak++;
        checkDate = fastDate;
      } else {
        break;
      }
    }

    // Protocol counts
    const protocolCounts: Record<string, number> = {};
    completedFasts.forEach((f) => {
      const p = f.protocol || "other";
      protocolCounts[p] = (protocolCounts[p] || 0) + 1;
    });

    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      if (currentAchievements.includes(achievement.id)) continue;

      let unlocked = false;
      const req = achievement.requirement;

      if (req.type === "total_fasts") {
        unlocked = totalFasts >= req.value;
      } else if (req.type === "total_hours") {
        unlocked = totalHours >= req.value;
      } else if (req.type === "streak") {
        unlocked = currentStreak >= req.value;
      } else if (req.type === "protocol_count" && req.protocol) {
        unlocked = (protocolCounts[req.protocol] || 0) >= req.value;
      } else if (req.type === "single_fast") {
        unlocked = completedFasts.some((f) => f.duration >= req.value * 60);
      } else if (req.type === "protocol_streak" && req.protocol) {
        unlocked = (protocolCounts[req.protocol] || 0) >= req.value;
      } else if (
        req.type === "all_achievements" &&
        achievement.id === "completionist"
      ) {
        const others = ACHIEVEMENTS.filter((a) => a.id !== "completionist");
        unlocked = others.every((a) => currentAchievements.includes(a.id));
      }

      if (unlocked) {
        newUnlocks.push(achievement.id);
      }
    }

    // Set first unlock for animation
    if (newUnlocks.length > 0 && !pendingUnlock) {
      setPendingUnlock(newUnlocks[0]);
    }

    return newUnlocks;
  };

  return (
    <AchievementContext.Provider
      value={{ checkForNewAchievements, pendingUnlock, dismissUnlock }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievements must be used within AchievementProvider");
  }
  return context;
}
