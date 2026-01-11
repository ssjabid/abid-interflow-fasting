import { useTheme } from "../../context/ThemeContext";
import {
  useSubscription,
  FEATURE_NAMES,
} from "../../context/SubscriptionContext";
import type { SubscriptionFeatures } from "../../services/subscription";

interface LockedFeatureProps {
  feature: keyof SubscriptionFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockOverlay?: boolean;
}

export default function LockedFeature({
  feature,
  children,
  fallback,
  showLockOverlay = true,
}: LockedFeatureProps) {
  const { theme } = useTheme();
  const { canAccessFeature, promptUpgrade } = useSubscription();

  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showLockOverlay) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        cursor: "pointer",
      }}
      onClick={() => promptUpgrade(feature)}
    >
      {/* Blurred content preview */}
      <div
        style={{
          filter: "blur(4px)",
          opacity: 0.5,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.bg}80`,
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.textMuted}
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: theme.colors.text,
            marginBottom: "4px",
          }}
        >
          {FEATURE_NAMES[feature]}
        </div>

        <div
          style={{
            fontSize: "12px",
            color: theme.colors.textMuted,
            marginBottom: "12px",
          }}
        >
          Upgrade to Pro to unlock
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            promptUpgrade(feature);
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#3B82F6",
            border: "none",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

// Simple lock icon button for inline use
export function LockButton({
  feature,
  onClick,
}: {
  feature: keyof SubscriptionFeatures;
  onClick?: () => void;
}) {
  const { canAccessFeature, promptUpgrade } = useSubscription();

  if (canAccessFeature(feature)) {
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        promptUpgrade(feature);
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        backgroundColor: "#3B82F620",
        border: "1px solid #3B82F650",
        color: "#3B82F6",
        fontSize: "11px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      PRO
    </button>
  );
}
