import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

interface AlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function AlertModal({
  isVisible,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
}: AlertModalProps) {
  const { theme } = useTheme();
  const [isClosing, setIsClosing] = useState(false);

  // Reset closing state when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleClose = (action: "confirm" | "cancel") => {
    setIsClosing(true);
    setTimeout(() => {
      if (action === "confirm") {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    }, 200);
  };

  // Icon based on type
  const getIcon = () => {
    const iconProps = {
      width: 32,
      height: 32,
      viewBox: "0 0 24 24",
      fill: "none",
      strokeWidth: 1.5,
    };

    switch (type) {
      case "success":
        return (
          <svg {...iconProps} stroke={theme.colors.accent}>
            <circle cx="12" cy="12" r="10" />
            <path
              d="M8 12l2.5 2.5L16 9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "warning":
        return (
          <svg {...iconProps} stroke="#F59E0B">
            <path
              d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
            />
          </svg>
        );
      case "error":
        return (
          <svg {...iconProps} stroke="#EF4444">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6m0-6l6 6" strokeLinecap="round" />
          </svg>
        );
      default:
        return (
          <svg {...iconProps} stroke={theme.colors.accent}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v.01M12 8v4" strokeLinecap="round" />
          </svg>
        );
    }
  };

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
        zIndex: 2000,
        padding: "24px",
        opacity: isClosing ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}
      onClick={() => handleClose(showCancel ? "cancel" : "confirm")}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "32px",
          maxWidth: "400px",
          width: "100%",
          transform: isClosing ? "scale(0.95)" : "scale(1)",
          opacity: isClosing ? 0 : 1,
          transition: "all 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getIcon()}
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: theme.colors.text,
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            fontSize: "14px",
            color: theme.colors.textMuted,
            textAlign: "center",
            marginBottom: "28px",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          {showCancel && (
            <button
              onClick={() => handleClose("cancel")}
              style={{
                flex: 1,
                padding: "14px 20px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => handleClose("confirm")}
            style={{
              flex: 1,
              padding: "14px 20px",
              backgroundColor: theme.colors.text,
              border: `1px solid ${theme.colors.text}`,
              color: theme.colors.bg,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
