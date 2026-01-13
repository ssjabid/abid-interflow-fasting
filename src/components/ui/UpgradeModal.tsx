import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  useSubscription,
  FEATURE_NAMES,
  FEATURE_DESCRIPTIONS,
} from "../../context/SubscriptionContext";
import { useAuth } from "../../context/AuthContext";
import {
  redirectToCheckout,
  isStripeConfigured,
  getPricingInfo,
} from "../../services/stripe";
import type { SubscriptionFeatures } from "../../services/subscription";
import type { PlanType } from "../../services/stripe";

interface UpgradeModalProps {
  onClose: () => void;
  feature?: keyof SubscriptionFeatures | null;
}

export default function UpgradeModal({ onClose, feature }: UpgradeModalProps) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { startTrial, activateKey, subscription } = useSubscription();
  const [activationKey, setActivationKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keySuccess, setKeySuccess] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState<PlanType | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const stripeEnabled = isStripeConfigured();
  const pricing = getPricingInfo();

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

  const handleActivateKey = async () => {
    if (!activationKey.trim()) {
      setKeyError("Please enter an activation key");
      return;
    }

    setIsActivating(true);
    setKeyError("");
    setKeySuccess("");

    const result = await activateKey(activationKey);

    if (result.success) {
      setKeySuccess(
        `Successfully activated ${
          result.tier === "infinite" ? "Infinite" : "Pro"
        }!`
      );
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setKeyError(result.error || "Invalid activation key");
    }

    setIsActivating(false);
  };

  const handleStripeCheckout = async (plan: PlanType) => {
    if (!currentUser?.uid || !currentUser?.email) {
      alert("Please make sure you're logged in with an email address.");
      return;
    }

    if (!stripeEnabled) {
      alert(
        "Payment system is being set up. Please use an activation key for now."
      );
      return;
    }

    setIsLoading(plan);
    try {
      await redirectToCheckout(currentUser.uid, currentUser.email, plan);
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to start checkout. Please try again.");
      setIsLoading(null);
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

          {/* Star icon */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: theme.colors.bgHover,
              border: `1px solid ${theme.colors.border}`,
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
              stroke={theme.colors.text}
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

        {/* Activation Key Section */}
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: theme.colors.textMuted,
              marginBottom: "12px",
            }}
          >
            Have an activation key?
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              value={activationKey}
              onChange={(e) => {
                setActivationKey(e.target.value.toUpperCase());
                setKeyError("");
                setKeySuccess("");
              }}
              placeholder="Enter activation key"
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: theme.colors.bg,
                border: `1px solid ${
                  keyError
                    ? "#EF4444"
                    : keySuccess
                    ? "#10B981"
                    : theme.colors.border
                }`,
                color: theme.colors.text,
                fontSize: "14px",
                fontFamily: "monospace",
                letterSpacing: "0.1em",
              }}
            />
            <button
              onClick={handleActivateKey}
              disabled={isActivating}
              style={{
                padding: "12px 20px",
                backgroundColor: theme.colors.text,
                border: "none",
                color: theme.colors.bg,
                fontSize: "13px",
                fontWeight: 600,
                cursor: isActivating ? "not-allowed" : "pointer",
                opacity: isActivating ? 0.7 : 1,
              }}
            >
              {isActivating ? "..." : "Activate"}
            </button>
          </div>
          {keyError && (
            <div
              style={{ color: "#EF4444", fontSize: "12px", marginTop: "8px" }}
            >
              {keyError}
            </div>
          )}
          {keySuccess && (
            <div
              style={{ color: "#10B981", fontSize: "12px", marginTop: "8px" }}
            >
              {keySuccess}
            </div>
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
              border: `2px solid ${theme.colors.text}`,
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
                backgroundColor: theme.colors.text,
                color: theme.colors.bg,
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
                marginBottom: "12px",
              }}
            >
              Pro
            </div>

            {/* Billing toggle */}
            <div
              style={{
                display: "flex",
                backgroundColor: theme.colors.bgHover,
                padding: "4px",
                marginBottom: "16px",
                gap: "4px",
              }}
            >
              <button
                onClick={() => setSelectedBilling("monthly")}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor:
                    selectedBilling === "monthly"
                      ? theme.colors.text
                      : "transparent",
                  border: "none",
                  color:
                    selectedBilling === "monthly"
                      ? theme.colors.bg
                      : theme.colors.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedBilling("yearly")}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor:
                    selectedBilling === "yearly"
                      ? theme.colors.text
                      : "transparent",
                  border: "none",
                  color:
                    selectedBilling === "yearly"
                      ? theme.colors.bg
                      : theme.colors.textMuted,
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Yearly
                <span
                  style={{
                    marginLeft: "4px",
                    backgroundColor: "#10B981",
                    color: "#fff",
                    padding: "2px 4px",
                    borderRadius: "2px",
                    fontSize: "9px",
                  }}
                >
                  -33%
                </span>
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              {selectedBilling === "monthly" ? (
                <>
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      color: theme.colors.text,
                    }}
                  >
                    {pricing.pro_monthly.price}
                  </span>
                  <span
                    style={{ fontSize: "14px", color: theme.colors.textMuted }}
                  >
                    {pricing.pro_monthly.period}
                  </span>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: "36px",
                      fontWeight: 700,
                      color: theme.colors.text,
                    }}
                  >
                    {pricing.pro_yearly.price}
                  </span>
                  <span
                    style={{ fontSize: "14px", color: theme.colors.textMuted }}
                  >
                    {pricing.pro_yearly.period}
                  </span>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#10B981",
                      marginTop: "4px",
                    }}
                  >
                    Save {pricing.pro_yearly.savings}
                  </div>
                </>
              )}
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
                    stroke={theme.colors.text}
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
                  backgroundColor: theme.colors.text,
                  border: "none",
                  color: theme.colors.bg,
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
                onClick={() =>
                  handleStripeCheckout(
                    selectedBilling === "monthly" ? "pro_monthly" : "pro_yearly"
                  )
                }
                disabled={isLoading !== null}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: theme.colors.text,
                  border: "none",
                  color: theme.colors.bg,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: isLoading !== null ? "not-allowed" : "pointer",
                  opacity: isLoading !== null ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {isLoading === "pro_monthly" || isLoading === "pro_yearly"
                  ? "Loading..."
                  : "Subscribe Now"}
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
                1 month free, then{" "}
                {selectedBilling === "monthly"
                  ? pricing.pro_monthly.price + "/month"
                  : pricing.pro_yearly.price + "/year"}
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
                backgroundColor: theme.colors.bgHover,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
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
              Infinite
            </div>

            <div style={{ marginBottom: "16px", marginTop: "52px" }}>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: theme.colors.text,
                }}
              >
                {pricing.infinite.price}
              </span>
              <span style={{ fontSize: "14px", color: theme.colors.textMuted }}>
                {" "}
                {pricing.infinite.period}
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
                    stroke={theme.colors.text}
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleStripeCheckout("infinite")}
              disabled={isLoading !== null}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                fontSize: "14px",
                fontWeight: 600,
                cursor: isLoading !== null ? "not-allowed" : "pointer",
                opacity: isLoading !== null ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {isLoading === "infinite" ? "Loading..." : "Get Lifetime Access"}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: "12px", color: theme.colors.textMuted }}>
              Secure payment powered by Stripe
            </span>
          </div>
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
