import { useSubscription } from "../../context/SubscriptionContext";

interface ProBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

// Icons for each tier
const BasicIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const ProIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const InfiniteIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
  >
    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
  </svg>
);

export default function ProBadge({
  size = "md",
  showText = true,
}: ProBadgeProps) {
  const { tier, tierName, tierColors } = useSubscription();

  const sizes = {
    sm: { padding: "3px 8px", fontSize: "10px", iconSize: 12, gap: "4px" },
    md: { padding: "4px 10px", fontSize: "11px", iconSize: 14, gap: "5px" },
    lg: { padding: "6px 14px", fontSize: "13px", iconSize: 16, gap: "6px" },
  };

  const { padding, fontSize, iconSize, gap } = sizes[size];

  const renderIcon = () => {
    switch (tier) {
      case "free":
        return <BasicIcon size={iconSize} color={tierColors.text} />;
      case "pro":
        return <ProIcon size={iconSize} color={tierColors.text} />;
      case "infinite":
        return <InfiniteIcon size={iconSize} color={tierColors.text} />;
    }
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        padding,
        backgroundColor: tierColors.bg,
        border: `1px solid ${tierColors.border}`,
        color: tierColors.text,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {renderIcon()}
      {showText && tierName}
    </span>
  );
}
