import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export type SubscriptionTier = "free" | "pro" | "infinite";

export interface Subscription {
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string; // undefined for infinite
  trialUsed: boolean;
  trialEndDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Admin emails from environment variable (comma-separated)
const getAdminEmails = (): string[] => {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS || "";
  return envEmails
    .split(",")
    .map((email: string) => email.trim().toLowerCase())
    .filter((email: string) => email.length > 0);
};

// Check if email is an admin
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
};

// Feature definitions
export interface SubscriptionFeatures {
  unlimitedHistory: boolean;
  allProtocols: boolean;
  customFasts: boolean;
  advancedAnalytics: boolean;
  dataExport: boolean;
  leaderboard: boolean;
  weightTracking: boolean;
  moodTracking: boolean;
  prioritySupport: boolean;
  founderBadge: boolean;
}

// Define what each tier gets
export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    unlimitedHistory: false,
    allProtocols: false,
    customFasts: false,
    advancedAnalytics: false,
    dataExport: false,
    leaderboard: false,
    weightTracking: false,
    moodTracking: false,
    prioritySupport: false,
    founderBadge: false,
  },
  pro: {
    unlimitedHistory: true,
    allProtocols: true,
    customFasts: true,
    advancedAnalytics: true,
    dataExport: true,
    leaderboard: true,
    weightTracking: true,
    moodTracking: true,
    prioritySupport: true,
    founderBadge: false,
  },
  infinite: {
    unlimitedHistory: true,
    allProtocols: true,
    customFasts: true,
    advancedAnalytics: true,
    dataExport: true,
    leaderboard: true,
    weightTracking: true,
    moodTracking: true,
    prioritySupport: true,
    founderBadge: true,
  },
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  historyDays: 7,
  protocols: ["16:8", "18:6", "20:4"], // Only basic protocols
};

// Pro-only protocols
export const PRO_PROTOCOLS = ["omad", "warrior", "water-fast"];

// Get user's subscription
export const getSubscription = async (
  userId: string,
  userEmail?: string | null
): Promise<Subscription> => {
  // Check if admin first
  if (isAdminEmail(userEmail)) {
    return {
      tier: "infinite",
      startDate: new Date().toISOString(),
      trialUsed: true,
    };
  }

  try {
    const subRef = doc(db, "subscriptions", userId);
    const subSnap = await getDoc(subRef);

    if (subSnap.exists()) {
      const sub = subSnap.data() as Subscription;

      // Check if pro subscription has expired
      if (sub.tier === "pro" && sub.endDate) {
        if (new Date(sub.endDate) < new Date()) {
          // Subscription expired, downgrade to free
          await setSubscription(userId, { ...sub, tier: "free" });
          return { ...sub, tier: "free" };
        }
      }

      // Check if trial has expired
      if (sub.trialEndDate && new Date(sub.trialEndDate) < new Date()) {
        if (sub.tier === "pro" && !sub.stripeSubscriptionId) {
          await setSubscription(userId, { ...sub, tier: "free" });
          return { ...sub, tier: "free" };
        }
      }

      return sub;
    }

    // Default to free tier
    const defaultSub: Subscription = {
      tier: "free",
      startDate: new Date().toISOString(),
      trialUsed: false,
    };

    await setSubscription(userId, defaultSub);
    return defaultSub;
  } catch (error) {
    console.error("Error getting subscription:", error);
    return {
      tier: "free",
      startDate: new Date().toISOString(),
      trialUsed: false,
    };
  }
};

// Set user's subscription
export const setSubscription = async (
  userId: string,
  subscription: Subscription
): Promise<void> => {
  try {
    const subRef = doc(db, "subscriptions", userId);
    await setDoc(subRef, {
      ...subscription,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error setting subscription:", error);
  }
};

// Start free trial (1 month)
export const startFreeTrial = async (userId: string): Promise<boolean> => {
  try {
    const current = await getSubscription(userId);

    if (current.trialUsed) {
      return false; // Trial already used
    }

    const trialEnd = new Date();
    trialEnd.setMonth(trialEnd.getMonth() + 1);

    await setSubscription(userId, {
      tier: "pro",
      startDate: new Date().toISOString(),
      endDate: trialEnd.toISOString(),
      trialUsed: true,
      trialEndDate: trialEnd.toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error starting trial:", error);
    return false;
  }
};

// Upgrade to Pro (monthly)
export const upgradeToPro = async (
  userId: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> => {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const current = await getSubscription(userId);

  await setSubscription(userId, {
    tier: "pro",
    startDate: new Date().toISOString(),
    endDate: endDate.toISOString(),
    trialUsed: current.trialUsed,
    stripeCustomerId,
    stripeSubscriptionId,
  });
};

// Upgrade to Infinite Pro (lifetime)
export const upgradeToInfinite = async (
  userId: string,
  stripeCustomerId?: string
): Promise<void> => {
  const current = await getSubscription(userId);

  await setSubscription(userId, {
    tier: "infinite",
    startDate: new Date().toISOString(),
    // No endDate for lifetime
    trialUsed: current.trialUsed,
    stripeCustomerId,
  });
};

// Check if user has access to a feature
export const hasFeature = (
  subscription: Subscription,
  feature: keyof SubscriptionFeatures
): boolean => {
  return TIER_FEATURES[subscription.tier][feature];
};

// Get features for current tier
export const getFeatures = (tier: SubscriptionTier): SubscriptionFeatures => {
  return TIER_FEATURES[tier];
};

// Check if protocol is available for tier
export const isProtocolAvailable = (
  protocolId: string,
  tier: SubscriptionTier
): boolean => {
  if (tier === "pro" || tier === "infinite") return true;
  return FREE_TIER_LIMITS.protocols.includes(protocolId);
};

// Get tier display name
export const getTierDisplayName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case "free":
      return "Basic";
    case "pro":
      return "Pro";
    case "infinite":
      return "Infinite Pro";
  }
};

// Get tier badge color
export const getTierBadgeColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case "free":
      return "#6B6B70";
    case "pro":
      return "#3B82F6";
    case "infinite":
      return "#F59E0B";
  }
};
