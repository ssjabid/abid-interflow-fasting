import { useTheme } from "../../context/ThemeContext";
import {
  useSubscription,
  FEATURE_NAMES,
  FEATURE_DESCRIPTIONS,
} from "../../context/SubscriptionContext";
import type { SubscriptionFeatures } from "../../services/subscription";

interface UpgradeModalProps {
  onClose: () => void;
  feature?: keyof SubscriptionFeatures | null;
}

export default function UpgradeModal({ onClose, feature }: UpgradeModalProps) {
  const { theme } = useTheme();
  const { startTrial, subscription } = useSubscription();

  const handleStartTrial = async () => {
    const success = await startTrial();
    if (success) {
      onClose();
    } else {
      alert(
        "You've already used your free trial. Please upgrade to Pro to continue."
      );
    }
  };

  const featureName = feature ? FEATURE_NAMES[feature] : null;
  const featureDesc = feature ? FEATURE_DESCRIPTIONS[feature] : null;

  const proFeatures = [
    "Unlimited fasting history",
    "All fasting protocols",
    "Custom fasts",
    "Advanced analytics",
    "Data export (CSV, PDF, JSON)",
    "Leaderboard access",
    "Weight & mood tracking",
    "Priority support",
  ];

  const infiniteFeatures = [
    "Everything in Pro",
    "Lifetime access",
    "All future updates",
    "Founder badge",
    "One-time payment",
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "24px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px 32px 24px",
            borderBottom: `1px solid ${theme.colors.border}`,
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              color: theme.colors.textMuted,
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Crown icon */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
            >
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: theme.colors.text,
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            {feature ? `Unlock ${featureName}` : "Upgrade to Pro"}
          </h2>

          {featureDesc && (
            <p
              style={{
                fontSize: "14px",
                color: theme.colors.textMuted,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              {featureDesc}
            </p>
          )}
        </div>

        {/* Pricing cards */}
        <div
          style={{
            padding: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Pro Plan */}
          <div
            style={{
              backgroundColor: theme.colors.bg,
              border: `2px solid #3B82F6`,
              padding: "24px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#3B82F6",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "4px 12px",
              }}
            >
              Most Popular
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Pro
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: theme.colors.text,
                }}
              >
                £7
              </span>
              <span style={{ fontSize: "14px", color: theme.colors.textMuted }}>
                /month
              </span>
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 20px 0",
              }}
            >
              {proFeatures.map((feat, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: theme.colors.textSecondary,
                    marginBottom: "8px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>

            {!subscription?.trialUsed ? (
              <button
                onClick={handleStartTrial}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#3B82F6",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Start Free Trial
              </button>
            ) : (
              <button
                onClick={() => {
                  // TODO: Integrate Stripe
                  alert(
                    "Stripe payment coming soon! For now, contact support."
                  );
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#3B82F6",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Subscribe Now
              </button>
            )}

            {!subscription?.trialUsed && (
              <p
                style={{
                  fontSize: "11px",
                  color: theme.colors.textMuted,
                  textAlign: "center",
                  marginTop: "8px",
                }}
              >
                1 month free, then £7/month
              </p>
            )}
          </div>

          {/* Infinite Pro Plan */}
          <div
            style={{
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              padding: "24px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "4px 12px",
              }}
            >
              Best Value
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "4px",
              }}
            >
              Infinite Pro
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: theme.colors.text,
                }}
              >
                £99
              </span>
              <span style={{ fontSize: "14px", color: theme.colors.textMuted }}>
                {" "}
                one-time
              </span>
            </div>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 20px 0",
              }}
            >
              {infiniteFeatures.map((feat, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: theme.colors.textSecondary,
                    marginBottom: "8px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                // TODO: Integrate Stripe
                alert("Stripe payment coming soon! For now, contact support.");
              }}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "transparent",
                border: `1px solid #F59E0B`,
                color: "#F59E0B",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Get Lifetime Access
            </button>

            <p
              style={{
                fontSize: "11px",
                color: theme.colors.textMuted,
                textAlign: "center",
                marginTop: "8px",
              }}
            >
              Pay once, own forever
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px 24px",
            textAlign: "center",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: theme.colors.textMuted,
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
