import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface PaymentSuccessProps {
  onContinue: () => void;
}

export default function PaymentSuccess({ onContinue }: PaymentSuccessProps) {
  const { theme } = useTheme();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onContinue]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.bg,
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "48px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#10B98120",
            border: "2px solid #10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: theme.colors.text,
            marginBottom: "12px",
          }}
        >
          Payment Successful!
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: theme.colors.textMuted,
            marginBottom: "32px",
            lineHeight: 1.6,
          }}
        >
          Thank you for your purchase! Your subscription has been activated and
          you now have access to all Pro features.
        </p>

        <div
          style={{
            backgroundColor: theme.colors.bg,
            border: `1px solid ${theme.colors.border}`,
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: theme.colors.textMuted,
              marginBottom: "8px",
            }}
          >
            Your account has been upgraded to
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: theme.colors.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.text}
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Pro
          </div>
        </div>

        <button
          onClick={onContinue}
          style={{
            width: "100%",
            padding: "16px 24px",
            backgroundColor: theme.colors.text,
            border: "none",
            color: theme.colors.bg,
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          Continue to App
        </button>

        <p
          style={{
            fontSize: "13px",
            color: theme.colors.textMuted,
          }}
        >
          Redirecting in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
