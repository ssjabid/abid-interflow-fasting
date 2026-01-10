import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

interface FastingTip {
  id: string;
  text: string;
  protocol: string[]; // Which protocols this tip applies to
  zone?: string; // Optional: which fasting zone this tip is for
}

// Comprehensive fasting tips database
export const FASTING_TIPS: FastingTip[] = [
  // General tips (apply to all)
  {
    id: "g1",
    text: "Stay hydrated! Aim for 8-10 glasses of water during your fast.",
    protocol: ["all"],
  },
  {
    id: "g2",
    text: "Black coffee and plain tea are your fasting friends - they won't break your fast.",
    protocol: ["all"],
  },
  {
    id: "g3",
    text: "Feeling hungry? It usually passes in 15-20 minutes. Stay busy!",
    protocol: ["all"],
  },
  {
    id: "g4",
    text: "Light walking during fasting can boost fat burning and mental clarity.",
    protocol: ["all"],
  },
  {
    id: "g5",
    text: "Avoid artificial sweeteners during fasting - they can trigger insulin response.",
    protocol: ["all"],
  },
  {
    id: "g6",
    text: "Sleep is crucial for fasting success. Aim for 7-8 hours each night.",
    protocol: ["all"],
  },
  {
    id: "g7",
    text: "Electrolytes matter! Add a pinch of salt to your water if you feel lightheaded.",
    protocol: ["all"],
  },
  {
    id: "g8",
    text: "Plan your eating window meals in advance to avoid impulsive eating.",
    protocol: ["all"],
  },
  {
    id: "g9",
    text: "Breaking your fast with protein helps maintain muscle mass.",
    protocol: ["all"],
  },
  {
    id: "g10",
    text: "Fasting gets easier with practice. Your body adapts over 2-3 weeks.",
    protocol: ["all"],
  },
  {
    id: "g11",
    text: "Distraction is key - engage in hobbies during challenging fasting hours.",
    protocol: ["all"],
  },
  {
    id: "g12",
    text: "Listen to your body. If you feel unwell, it's okay to break your fast.",
    protocol: ["all"],
  },
  {
    id: "g13",
    text: "Fasting is not about restriction, it's about timing your nutrition.",
    protocol: ["all"],
  },
  {
    id: "g14",
    text: "Avoid high-intensity workouts at the end of your fasting window.",
    protocol: ["all"],
  },
  {
    id: "g15",
    text: "Chewing gum can stimulate hunger. Avoid it while fasting.",
    protocol: ["all"],
  },

  // 16:8 specific
  {
    id: "168_1",
    text: "16:8 is perfect for beginners. Start by skipping breakfast.",
    protocol: ["16:8"],
  },
  {
    id: "168_2",
    text: "A common 16:8 schedule: fast from 8PM to 12PM noon.",
    protocol: ["16:8"],
  },
  {
    id: "168_3",
    text: "16:8 aligns well with social dinners - keep your window in the evening.",
    protocol: ["16:8"],
  },
  {
    id: "168_4",
    text: "With 16:8, you can still have 2-3 full meals in your eating window.",
    protocol: ["16:8"],
  },
  {
    id: "168_5",
    text: "Morning coffee with a splash of cream won't significantly impact your fast.",
    protocol: ["16:8"],
  },
  {
    id: "168_6",
    text: "16:8 is sustainable long-term. Many people do it for years.",
    protocol: ["16:8"],
  },
  {
    id: "168_7",
    text: "Consistency matters more than perfection. Aim for 16:8 most days.",
    protocol: ["16:8"],
  },
  {
    id: "168_8",
    text: "Your metabolism won't slow down with 16:8 - this is a myth!",
    protocol: ["16:8"],
  },

  // 18:6 specific
  {
    id: "186_1",
    text: "18:6 offers deeper ketosis than 16:8. You'll feel more mental clarity.",
    protocol: ["18:6"],
  },
  {
    id: "186_2",
    text: "With 18:6, focus on nutrient-dense meals to meet your daily needs.",
    protocol: ["18:6"],
  },
  {
    id: "186_3",
    text: "18:6 works great with two larger meals instead of three smaller ones.",
    protocol: ["18:6"],
  },
  {
    id: "186_4",
    text: "The extra 2 hours of fasting in 18:6 significantly boosts autophagy.",
    protocol: ["18:6"],
  },
  {
    id: "186_5",
    text: "Consider 18:6 as your next step after mastering 16:8.",
    protocol: ["18:6"],
  },
  {
    id: "186_6",
    text: "Bone broth during your fast can help with 18:6 if you're struggling.",
    protocol: ["18:6"],
  },

  // 20:4 specific
  {
    id: "204_1",
    text: "20:4 (Warrior Diet) mimics ancient eating patterns. One main meal a day.",
    protocol: ["20:4"],
  },
  {
    id: "204_2",
    text: "During 20:4, your single meal should be substantial and nutritious.",
    protocol: ["20:4"],
  },
  {
    id: "204_3",
    text: "20:4 can be challenging socially. Plan your eating window around dinner.",
    protocol: ["20:4"],
  },
  {
    id: "204_4",
    text: "Deep autophagy kicks in around hour 18-20. You're in the zone!",
    protocol: ["20:4"],
  },
  {
    id: "204_5",
    text: "With 20:4, prioritize protein to maintain muscle mass.",
    protocol: ["20:4"],
  },
  {
    id: "204_6",
    text: "Some people on 20:4 have a small snack before their main meal.",
    protocol: ["20:4"],
  },

  // OMAD specific
  {
    id: "omad_1",
    text: "OMAD maximizes autophagy and growth hormone levels.",
    protocol: ["omad"],
  },
  {
    id: "omad_2",
    text: "Your OMAD meal should be 1200-2000 calories depending on your goals.",
    protocol: ["omad"],
  },
  {
    id: "omad_3",
    text: "OMAD simplifies life - no meal prep, no meal planning except once.",
    protocol: ["omad"],
  },
  {
    id: "omad_4",
    text: "Eat slowly during OMAD to aid digestion and nutrient absorption.",
    protocol: ["omad"],
  },
  {
    id: "omad_5",
    text: "OMAD isn't for everyone. If you feel weak, try 20:4 instead.",
    protocol: ["omad"],
  },
  {
    id: "omad_6",
    text: "Some OMAD practitioners extend their 'meal' over 1-2 hours.",
    protocol: ["omad"],
  },
  {
    id: "omad_7",
    text: "OMAD paired with exercise can accelerate fat loss significantly.",
    protocol: ["omad"],
  },

  // Water fasting specific
  {
    id: "water_1",
    text: "Water fasting beyond 24 hours requires careful preparation.",
    protocol: ["water"],
  },
  {
    id: "water_2",
    text: "During water fasts, electrolytes are essential. Consider supplements.",
    protocol: ["water"],
  },
  {
    id: "water_3",
    text: "Break a water fast gently with bone broth or light soup.",
    protocol: ["water"],
  },
  {
    id: "water_4",
    text: "Extended water fasts (48h+) should be discussed with a healthcare provider.",
    protocol: ["water"],
  },
  {
    id: "water_5",
    text: "Water fasting triggers deep cellular repair through autophagy.",
    protocol: ["water"],
  },
  {
    id: "water_6",
    text: "Rest more during water fasts. Your body is doing important work.",
    protocol: ["water"],
  },
  {
    id: "water_7",
    text: "Mental clarity often peaks around hour 24-36 of a water fast.",
    protocol: ["water"],
  },
  {
    id: "water_8",
    text: "Refeeding after water fasts is crucial. Start with small, easy foods.",
    protocol: ["water"],
  },

  // Zone-specific tips
  {
    id: "zone_1",
    text: "Hours 0-4: Your body is still processing your last meal. Stay busy!",
    protocol: ["all"],
    zone: "fed",
  },
  {
    id: "zone_2",
    text: "Hours 4-8: Blood sugar dropping. This is when cravings peak. Push through!",
    protocol: ["all"],
    zone: "early",
  },
  {
    id: "zone_3",
    text: "Hours 8-12: Fat burning mode activated. Your body is switching fuel sources.",
    protocol: ["all"],
    zone: "fat_burning",
  },
  {
    id: "zone_4",
    text: "Hours 12-18: Ketosis begins. Mental clarity increases. You're doing great!",
    protocol: ["all"],
    zone: "ketosis",
  },
  {
    id: "zone_5",
    text: "Hours 18-24: Deep ketosis. Autophagy is ramping up. Cellular cleanup!",
    protocol: ["all"],
    zone: "deep_ketosis",
  },
  {
    id: "zone_6",
    text: "24+ hours: Maximum autophagy. Growth hormone elevated. Elite territory!",
    protocol: ["all"],
    zone: "extended",
  },
];

interface FastingTipDisplayProps {
  protocol?: string;
  zone?: string;
}

export default function FastingTipDisplay({
  protocol,
  zone,
}: FastingTipDisplayProps) {
  const { theme } = useTheme();
  const [currentTip, setCurrentTip] = useState<FastingTip | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const getRelevantTips = () => {
    return FASTING_TIPS.filter((tip) => {
      const protocolMatch =
        tip.protocol.includes("all") ||
        (protocol && tip.protocol.includes(protocol));
      const zoneMatch = !tip.zone || (zone && tip.zone === zone);
      return protocolMatch && zoneMatch;
    });
  };

  const selectRandomTip = () => {
    const tips = getRelevantTips();
    if (tips.length > 0) {
      const randomIndex = Math.floor(Math.random() * tips.length);
      setCurrentTip(tips[randomIndex]);
    }
  };

  useEffect(() => {
    selectRandomTip();
    // Change tip every 30 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        selectRandomTip();
        setIsVisible(true);
      }, 300);
    }, 30000);
    return () => clearInterval(interval);
  }, [protocol, zone]);

  if (!currentTip) return null;

  return (
    <div
      style={{
        backgroundColor: theme.colors.accent + "10",
        border: `1px solid ${theme.colors.accent}30`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: theme.colors.accent + "20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.colors.accent,
            marginBottom: "4px",
          }}
        >
          Fasting Tip
        </div>
        <div
          style={{
            fontSize: "13px",
            color: theme.colors.text,
            lineHeight: 1.5,
          }}
        >
          {currentTip.text}
        </div>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            selectRandomTip();
            setIsVisible(true);
          }, 300);
        }}
        style={{
          background: "none",
          border: "none",
          color: theme.colors.textMuted,
          cursor: "pointer",
          padding: "4px",
          fontSize: "12px",
        }}
        title="Next tip"
      >
        ↻
      </button>
    </div>
  );
}
