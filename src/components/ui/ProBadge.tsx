import { useSubscription } from "../../context/SubscriptionContext";

interface ProBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function ProBadge({
  size = "md",
  showText = true,
}: ProBadgeProps) {
  const { tier, tierName, tierColor, isInfinite } = useSubscription();

  if (tier === "free") return null;

  const sizes = {
    sm: { padding: "2px 6px", fontSize: "9px", iconSize: 10 },
    md: { padding: "4px 10px", fontSize: "11px", iconSize: 12 },
    lg: { padding: "6px 14px", fontSize: "13px", iconSize: 14 },
  };

  const { padding, fontSize, iconSize } = sizes[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding,
        backgroundColor: `${tierColor}20`,
        border: `1px solid ${tierColor}50`,
        color: tierColor,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {isInfinite ? (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      ) : (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
      {showText && tierName}
    </span>
  );
}
