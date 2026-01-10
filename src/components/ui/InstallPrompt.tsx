import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Don't show for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        padding: "16px 20px",
        maxWidth: "360px",
        width: "calc(100% - 48px)",
        zIndex: 9998,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: theme.colors.bg,
            border: `1px solid ${theme.colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: theme.colors.text,
              marginBottom: "4px",
            }}
          >
            Install Interflow
          </div>
          <div
            style={{
              fontSize: "13px",
              color: theme.colors.textMuted,
              lineHeight: 1.4,
            }}
          >
            Add to your home screen for quick access and offline use.
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: theme.colors.textMuted,
            cursor: "pointer",
            padding: "4px",
            fontSize: "18px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: "transparent",
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textMuted,
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          style={{
            flex: 1,
            padding: "12px",
            backgroundColor: theme.colors.accent,
            border: "none",
            color: theme.accent === "default" ? "#0B0B0C" : "#FFFFFF",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
