import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import {
  type Subscription,
  type SubscriptionTier,
  type SubscriptionFeatures,
  getSubscription,
  startFreeTrial,
  activateWithKey,
  TIER_FEATURES,
  getTierDisplayName,
  getTierColors,
  isProtocolAvailable,
  FREE_TIER_LIMITS,
} from "../services/subscription";

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  tier: SubscriptionTier;
  features: SubscriptionFeatures;
  tierName: string;
  tierColors: { bg: string; border: string; text: string };
  isPro: boolean;
  isInfinite: boolean;
  canAccessFeature: (feature: keyof SubscriptionFeatures) => boolean;
  canAccessProtocol: (protocolId: string) => boolean;
  startTrial: () => Promise<boolean>;
  activateKey: (
    key: string
  ) => Promise<{ success: boolean; tier?: SubscriptionTier; error?: string }>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  upgradeFeature: keyof SubscriptionFeatures | null;
  promptUpgrade: (feature: keyof SubscriptionFeatures) => void;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<
    keyof SubscriptionFeatures | null
  >(null);

  // Load subscription on user change
  useEffect(() => {
    const loadSubscription = async () => {
      if (!currentUser) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const sub = await getSubscription(currentUser.uid, currentUser.email);
        setSubscription(sub);
      } catch (error) {
        console.error("Error loading subscription:", error);
        setSubscription({
          tier: "free",
          startDate: new Date().toISOString(),
          trialUsed: false,
        });
      }
      setLoading(false);
    };

    loadSubscription();
  }, [currentUser]);

  const tier = subscription?.tier || "free";
  const features = TIER_FEATURES[tier];
  const tierName = getTierDisplayName(tier);
  const tierColors = getTierColors(tier, theme.mode);
  const isPro = tier === "pro" || tier === "infinite";
  const isInfinite = tier === "infinite";

  const canAccessFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return features[feature];
  };

  const canAccessProtocol = (protocolId: string): boolean => {
    return isProtocolAvailable(protocolId, tier);
  };

  const startTrial = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const success = await startFreeTrial(currentUser.uid);
    if (success) {
      const sub = await getSubscription(currentUser.uid, currentUser.email);
      setSubscription(sub);
    }
    return success;
  };

  const activateKey = async (
    key: string
  ): Promise<{ success: boolean; tier?: SubscriptionTier; error?: string }> => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    const result = await activateWithKey(currentUser.uid, key);
    if (result.success) {
      const sub = await getSubscription(currentUser.uid, currentUser.email);
      setSubscription(sub);
    }
    return result;
  };

  const promptUpgrade = (feature: keyof SubscriptionFeatures) => {
    setUpgradeFeature(feature);
    setShowUpgradeModal(true);
  };

  const refreshSubscription = async () => {
    if (!currentUser) return;
    const sub = await getSubscription(currentUser.uid, currentUser.email);
    setSubscription(sub);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        tier,
        features,
        tierName,
        tierColors,
        isPro,
        isInfinite,
        canAccessFeature,
        canAccessProtocol,
        startTrial,
        activateKey,
        showUpgradeModal,
        setShowUpgradeModal,
        upgradeFeature,
        promptUpgrade,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// Feature names for display
export const FEATURE_NAMES: Record<keyof SubscriptionFeatures, string> = {
  unlimitedHistory: "Unlimited History",
  allProtocols: "All Fasting Protocols",
  customFasts: "Custom Fasts",
  advancedAnalytics: "Advanced Analytics",
  dataExport: "Data Export",
  leaderboard: "Leaderboard",
  weightTracking: "Weight Tracking",
  moodTracking: "Mood & Energy Tracking",
  prioritySupport: "Priority Support",
  founderBadge: "Founder Badge",
};

// Feature descriptions
export const FEATURE_DESCRIPTIONS: Record<keyof SubscriptionFeatures, string> =
  {
    unlimitedHistory:
      "Access your complete fasting history, not just the last 7 days",
    allProtocols: "Unlock OMAD, Warrior Diet, Water Fast, and more protocols",
    customFasts: "Create your own custom fasting protocols",
    advancedAnalytics:
      "Detailed charts, trends, and insights about your fasting",
    dataExport: "Export your data as CSV, PDF, or JSON",
    leaderboard: "Compete with other fasters on the global leaderboard",
    weightTracking: "Track your weight progress over time",
    moodTracking: "Log mood and energy levels with each fast",
    prioritySupport: "Get faster responses from our support team",
    founderBadge: "Exclusive badge showing your lifetime membership",
  };

// Re-export for convenience
export { FREE_TIER_LIMITS };
