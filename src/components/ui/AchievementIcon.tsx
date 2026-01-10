import type { ReactNode } from "react";
import type { AchievementCategory, AchievementTier } from "../../types";
import { ACHIEVEMENT_TIERS } from "../../types";

interface AchievementIconProps {
  category: AchievementCategory;
  tier: AchievementTier;
  size?: number;
  unlocked?: boolean;
}

export default function AchievementIcon({
  category,
  tier,
  size = 48,
  unlocked = false,
}: AchievementIconProps) {
  const tierInfo = ACHIEVEMENT_TIERS[tier];
  const strokeColor = unlocked ? "#F5F5F5" : "#4A4A4A";
  const fillColor = unlocked ? tierInfo.color : "#2A2A2A";
  const bgColor = unlocked ? tierInfo.bgColor : "rgba(20, 20, 20, 0.8)";

  const iconSize = size * 0.45;

  const icons: Record<AchievementCategory, ReactNode> = {
    general: (
      // Clock icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth="2" />
        <path
          d="M12 7v5l3 3"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    streak: (
      // Fire/Lightning icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M13 2L4 14h7l-1 8 10-12h-7l1-8z"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.3}
        />
      </svg>
    ),
    milestone: (
      // Trophy icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2"
          stroke={strokeColor}
          strokeWidth="2"
        />
        <path
          d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"
          stroke={strokeColor}
          strokeWidth="2"
        />
        <path
          d="M6 3h12v6a6 6 0 01-12 0V3z"
          stroke={strokeColor}
          strokeWidth="2"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.3}
        />
        <path d="M12 15v4" stroke={strokeColor} strokeWidth="2" />
        <path
          d="M8 21h8"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    "16:8": (
      // Balanced scale / simple icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="2"
          stroke={strokeColor}
          strokeWidth="2"
        />
        <text
          x="12"
          y="15"
          textAnchor="middle"
          fill={strokeColor}
          fontSize="8"
          fontWeight="bold"
        >
          16
        </text>
      </svg>
    ),
    "18:6": (
      // Star icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <polygon
          points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.3}
        />
      </svg>
    ),
    "20:4": (
      // Shield icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L4 7v6c0 5.25 3.4 9.5 8 10.5 4.6-1 8-5.25 8-10.5V7l-8-4z"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.3}
        />
        <path
          d="M9 12l2 2 4-4"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    omad: (
      // Diamond icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 3h12l4 7-10 12L2 10l4-7z"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.3}
        />
        <path d="M2 10h20" stroke={strokeColor} strokeWidth="2" />
        <path d="M12 22V10" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    ),
    water: (
      // Water droplet icon
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C12 2 6 9 6 14a6 6 0 0012 0c0-5-6-12-6-12z"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.3}
        />
        <path
          d="M10 16a2 2 0 01-2-2"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    special: (
      // Crown/infinity icon for completionist
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 8l4 3 5-6 5 6 4-3v10H3V8z"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          fill={unlocked ? fillColor : "none"}
          fillOpacity={0.4}
        />
        <circle cx="3" cy="8" r="1.5" fill={strokeColor} />
        <circle cx="21" cy="8" r="1.5" fill={strokeColor} />
        <circle cx="12" cy="5" r="1.5" fill={strokeColor} />
      </svg>
    ),
  };

  // Badge shape based on tier
  const getBadgeShape = () => {
    const shapes: Record<AchievementTier, ReactNode> = {
      bronze: (
        <circle
          cx="12"
          cy="12"
          r="11"
          fill={bgColor}
          stroke={unlocked ? tierInfo.color : "#2A2A2A"}
          strokeWidth="1.5"
        />
      ),
      silver: (
        <polygon
          points="12,1 23,12 12,23 1,12"
          fill={bgColor}
          stroke={unlocked ? tierInfo.color : "#2A2A2A"}
          strokeWidth="1.5"
        />
      ),
      gold: (
        <path
          d="M12 1l3.5 7 7.5 1-5.5 5 1.5 7.5-7-4-7 4 1.5-7.5-5.5-5 7.5-1z"
          fill={bgColor}
          stroke={unlocked ? tierInfo.color : "#2A2A2A"}
          strokeWidth="1.5"
        />
      ),
      platinum: (
        <>
          <circle
            cx="12"
            cy="12"
            r="11"
            fill={bgColor}
            stroke={unlocked ? tierInfo.color : "#2A2A2A"}
            strokeWidth="1.5"
          />
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke={unlocked ? tierInfo.color : "#3A3A3A"}
            strokeWidth="0.5"
          />
        </>
      ),
      adamantium: (
        <>
          <polygon
            points="12,0 24,12 12,24 0,12"
            fill={bgColor}
            stroke={unlocked ? tierInfo.color : "#2A2A2A"}
            strokeWidth="2"
          />
          <polygon
            points="12,4 20,12 12,20 4,12"
            fill="none"
            stroke={unlocked ? tierInfo.color : "#3A3A3A"}
            strokeWidth="1"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            fill={unlocked ? tierInfo.color : "#3A3A3A"}
            opacity={unlocked ? 0.6 : 0.3}
          />
        </>
      ),
    };
    return shapes[tier];
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Background badge shape */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          filter: unlocked
            ? `drop-shadow(0 0 ${size / 8}px ${tierInfo.color}40)`
            : "none",
        }}
      >
        {getBadgeShape()}
      </svg>

      {/* Category icon */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icons[category]}
      </div>
    </div>
  );
}
