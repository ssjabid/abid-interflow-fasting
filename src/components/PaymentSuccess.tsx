import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useTheme } from "../context/ThemeContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

interface PaymentSuccessProps {
  plan: string;
  onComplete: () => void;
}

export default function PaymentSuccess({
  plan,
  onComplete,
}: PaymentSuccessProps) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Processing your payment...");

  useEffect(() => {
    const activateSubscription = async () => {
      if (!currentUser?.uid) {
        setStatus("error");
        setMessage("Please log in to activate your subscription.");
        return;
      }

      try {
        const tier = plan === "infinite" ? "infinite" : "pro";
        const now = new Date().toISOString();

        // Calculate end date (1 month for pro, undefined for infinite)
        let endDate: string | undefined;
        if (tier === "pro") {
          const end = new Date();
          end.setMonth(end.getMonth() + 1);
          endDate = end.toISOString();
        }

        // Update subscription in Firebase
        const subRef = doc(db, "subscriptions", currentUser.uid);
        await setDoc(
          subRef,
          {
            tier,
            startDate: now,
            ...(endDate && { endDate }),
            trialUsed: true,
            paidViaStripe: true,
            plan,
            updatedAt: now,
          },
          { merge: true }
        );

        // Refresh the subscription context
        await refreshSubscription();

        setStatus("success");
        setMessage(
          tier === "infinite"
            ? "Welcome to Infinite Pro! You now have lifetime access."
            : "Welcome to Pro! Your subscription is now active."
        );

        // Redirect after 2 seconds
        setTimeout(() => {
          onComplete();
        }, 2500);
      } catch (error) {
        console.error("Error activating subscription:", error);
        setStatus("error");
        setMessage(
          "There was an issue activating your subscription. Please contact support."
        );
      }
    };

    activateSubscription();
  }, [currentUser, plan, refreshSubscription, onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "48px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor:
              status === "success"
                ? "#10B98120"
                : status === "error"
                ? "#EF444420"
                : theme.colors.bgHover,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          {status === "processing" && (
            <div
              style={{
                width: "24px",
                height: "24px",
                border: `3px solid ${theme.colors.border}`,
                borderTopColor: theme.colors.text,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          )}
          {status === "success" && (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {status === "error" && (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: theme.colors.text,
            marginBottom: "12px",
          }}
        >
          {status === "processing" && "Activating..."}
          {status === "success" && "Payment Successful!"}
          {status === "error" && "Activation Failed"}
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: "14px",
            color: theme.colors.textMuted,
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          {message}
        </p>

        {/* Manual continue button for error state */}
        {status === "error" && (
          <button
            onClick={onComplete}
            style={{
              padding: "12px 32px",
              backgroundColor: theme.colors.text,
              border: "none",
              color: theme.colors.bg,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue to App
          </button>
        )}

        {status === "success" && (
          <p style={{ fontSize: "12px", color: theme.colors.textMuted }}>
            Redirecting you now...
          </p>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
