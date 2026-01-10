import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS } from "../../types";

interface AchievementUnlockProps {
  achievementId: string;
  onClose: () => void;
}

export default function AchievementUnlock({
  achievementId,
  onClose,
}: AchievementUnlockProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  const tierInfo = achievement ? ACHIEVEMENT_TIERS[achievement.tier] : null;

  useEffect(() => {
    // Fade in
    const showTimer = setTimeout(() => setVisible(true), 50);

    // Auto close after 4 seconds
    const closeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  if (!achievement || !tierInfo) return null;

  return (
    <div
      onClick={() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: visible ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0)",
        transition: "background-color 0.3s ease",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          padding: "40px",
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(20px)",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: tierInfo.color,
          }}
        >
          Achievement Unlocked
        </div>

        {/* Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: tierInfo.color + "20",
            border: `2px solid ${tierInfo.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px ${tierInfo.color}40`,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={tierInfo.color}
            strokeWidth="2"
          >
            <path d="M12 15l-2 5l9-13h-7l2-5l-9 13h7z" />
          </svg>
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {achievement.name}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "14px",
            color: theme.colors.textMuted,
            textAlign: "center",
            maxWidth: "280px",
          }}
        >
          {achievement.description}
        </div>

        {/* Tier badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: tierInfo.color + "15",
            border: `1px solid ${tierInfo.color}30`,
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: tierInfo.color,
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: tierInfo.color,
            }}
          >
            {tierInfo.name}
          </span>
        </div>

        {/* Tap hint */}
        <div
          style={{
            fontSize: "11px",
            color: theme.colors.textMuted,
            opacity: 0.5,
            marginTop: "8px",
          }}
        >
          Tap to continue
        </div>
      </div>
    </div>
  );
}
