import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import type { Fast } from "../../types";

interface EditFastModalProps {
  fast: Fast | null;
  isVisible: boolean;
  onSave: (
    fastId: string,
    updates: { mood?: number; energyLevel?: number; notes?: string },
  ) => void;
  onClose: () => void;
}

const MOOD_LEVELS = [
  { value: 1, label: "Struggling" },
  { value: 2, label: "Difficult" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

const ENERGY_LEVELS = [
  { value: 1, label: "Very Low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "High" },
  { value: 5, label: "Energized" },
];

// Mood icon component - face expressions
const MoodIcon = ({ value, color }: { value: number; color: string }) => {
  const mouthPaths: Record<number, string> = {
    1: "M8 16 Q12 12 16 16", // Deep frown
    2: "M8 15 Q12 13 16 15", // Slight frown
    3: "M8 14 L16 14", // Neutral line
    4: "M8 13 Q12 16 16 13", // Smile
    5: "M8 12 Q12 17 16 12", // Big smile
  };

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="9" r="1" fill={color} />
      <circle cx="16" cy="9" r="1" fill={color} />
      <path d={mouthPaths[value]} strokeLinecap="round" />
    </svg>
  );
};

// Energy icon component - battery/lightning styles
const EnergyIcon = ({ value, color }: { value: number; color: string }) => {
  // Different fill levels for battery
  const fillHeight = value * 3;
  const fillY = 17 - fillHeight;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
    >
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <rect x="9" y="1" width="6" height="3" rx="1" />
      <rect
        x="8"
        y={fillY}
        width="8"
        height={fillHeight}
        fill={color}
        opacity="0.6"
      />
      {value >= 4 && (
        <path
          d="M12 8 L10 12 L14 12 L12 16"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
        />
      )}
    </svg>
  );
};

export default function EditFastModal({
  fast,
  isVisible,
  onSave,
  onClose,
}: EditFastModalProps) {
  const { theme } = useTheme();
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [energyLevel, setEnergyLevel] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when fast changes
  useEffect(() => {
    if (fast) {
      setMood(fast.mood);
      setEnergyLevel(fast.energyLevel);
      setNotes(fast.notes || "");
    }
  }, [fast]);

  // Animation state for closing
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!isVisible || !fast) return null;

  const handleSave = async () => {
    if (!fast.id) {
      console.error("No fast ID found");
      alert("Error: Could not save changes. Please try again.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(fast.id, {
        mood,
        energyLevel,
        notes: notes.trim() || undefined,
      });
      // Close with animation after successful save
      setIsClosing(true);
      setTimeout(() => {
        setIsSaving(false);
        setIsClosing(false);
        onClose();
      }, 200);
    } catch (error) {
      console.error("Error saving:", error);
      setIsSaving(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        zIndex: 1000,
        padding: "24px",
        opacity: isClosing ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          padding: "32px",
          maxWidth: "480px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "8px",
              }}
            >
              Edit Fast
            </h3>
            <button
              onClick={handleClose}
              style={{
                background: "none",
                border: "none",
                color: theme.colors.textMuted,
                fontSize: "24px",
                cursor: "pointer",
                padding: "0",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <p style={{ fontSize: "13px", color: theme.colors.textMuted }}>
            {formatDate(fast.startTime)} • {formatDuration(fast.duration)}
          </p>
        </div>

        {/* Mood Selection */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: theme.colors.textMuted,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            How did you feel?
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {MOOD_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() =>
                  setMood(mood === level.value ? undefined : level.value)
                }
                style={{
                  flex: "1 1 auto",
                  minWidth: "70px",
                  padding: "12px 8px",
                  backgroundColor:
                    mood === level.value ? theme.colors.text : theme.colors.bg,
                  border: `1px solid ${mood === level.value ? theme.colors.text : theme.colors.border}`,
                  color:
                    mood === level.value ? theme.colors.bg : theme.colors.text,
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <MoodIcon
                  value={level.value}
                  color={
                    mood === level.value ? theme.colors.bg : theme.colors.text
                  }
                />
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level Selection */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: theme.colors.textMuted,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Energy Level
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {ENERGY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() =>
                  setEnergyLevel(
                    energyLevel === level.value ? undefined : level.value,
                  )
                }
                style={{
                  flex: "1 1 auto",
                  minWidth: "70px",
                  padding: "12px 8px",
                  backgroundColor:
                    energyLevel === level.value
                      ? theme.colors.text
                      : theme.colors.bg,
                  border: `1px solid ${energyLevel === level.value ? theme.colors.text : theme.colors.border}`,
                  color:
                    energyLevel === level.value
                      ? theme.colors.bg
                      : theme.colors.text,
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <EnergyIcon
                  value={level.value}
                  color={
                    energyLevel === level.value
                      ? theme.colors.bg
                      : theme.colors.text
                  }
                />
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: theme.colors.textMuted,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was this fast? Any observations..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              color: theme.colors.text,
              fontSize: "14px",
              resize: "vertical",
              fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.colors.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "14px",
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: "14px",
              backgroundColor: theme.colors.text,
              border: "none",
              color: theme.colors.bg,
              fontSize: "14px",
              fontWeight: 600,
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
