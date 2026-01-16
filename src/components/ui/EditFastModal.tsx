import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import type { Fast } from "../../types";

interface EditFastModalProps {
  fast: Fast | null;
  isVisible: boolean;
  onSave: (
    fastId: string,
    updates: { mood?: number; energyLevel?: number; notes?: string }
  ) => void;
  onClose: () => void;
}

const MOOD_LEVELS = [
  { value: 1, label: "Struggling", emoji: "😫" },
  { value: 2, label: "Difficult", emoji: "😕" },
  { value: 3, label: "Neutral", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😄" },
];

const ENERGY_LEVELS = [
  { value: 1, label: "Very Low", emoji: "🔋" },
  { value: 2, label: "Low", emoji: "🪫" },
  { value: 3, label: "Moderate", emoji: "⚡" },
  { value: 4, label: "High", emoji: "⚡⚡" },
  { value: 5, label: "Energized", emoji: "🚀" },
];

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

  if (!isVisible || !fast) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(fast.UserId, {
      mood,
      energyLevel,
      notes: notes.trim() || undefined,
    });
    setIsSaving(false);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
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
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
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
              onClick={onClose}
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
                    mood === level.value
                      ? theme.colors.accent
                      : theme.colors.bg,
                  border: `1px solid ${
                    mood === level.value
                      ? theme.colors.accent
                      : theme.colors.border
                  }`,
                  color: mood === level.value ? "#FFFFFF" : theme.colors.text,
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "18px" }}>{level.emoji}</span>
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
                    energyLevel === level.value ? undefined : level.value
                  )
                }
                style={{
                  flex: "1 1 auto",
                  minWidth: "70px",
                  padding: "12px 8px",
                  backgroundColor:
                    energyLevel === level.value
                      ? theme.colors.accent
                      : theme.colors.bg,
                  border: `1px solid ${
                    energyLevel === level.value
                      ? theme.colors.accent
                      : theme.colors.border
                  }`,
                  color:
                    energyLevel === level.value ? "#FFFFFF" : theme.colors.text,
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "14px" }}>{level.emoji}</span>
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
            onClick={onClose}
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
