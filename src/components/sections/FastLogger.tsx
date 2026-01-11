import { useState, useEffect } from "react";
import type { Fast, FastingZone, Protocol } from "../../types";
import { PROTOCOLS, FASTING_ZONES } from "../../types";
import { useTheme } from "../../context/ThemeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { PRO_PROTOCOLS } from "../../services/subscription";
import FastingTipDisplay from "../ui/FastingTips";

interface FastLoggerProps {
  onStartFast: (fast: Fast) => void;
  onEndFast: (fastId: string, mood?: number, energyLevel?: number) => void;
  activeFast: Fast | null;
  userId: string;
}

export default function FastLogger({
  onStartFast,
  onEndFast,
  activeFast,
  userId,
}: FastLoggerProps) {
  const { theme } = useTheme();
  const { canAccessFeature, canAccessProtocol, promptUpgrade } =
    useSubscription();
  // In dark mode with default accent (white): text should be dark
  // In light mode with default accent (dark): text should be white
  // For colored accents: text should always be white
  const accentTextColor =
    theme.mode === "light"
      ? theme.accent === "default"
        ? "#FFFFFF"
        : "#FFFFFF"
      : theme.accent === "default"
      ? "#0B0B0C"
      : "#FFFFFF";

  const [notes, setNotes] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState("16:8");
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endMood, setEndMood] = useState(3);
  const [endEnergy, setEndEnergy] = useState(3);
  const [showTips, setShowTips] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customProtocols, setCustomProtocols] = useState<Protocol[]>([]);
  const [newCustomName, setNewCustomName] = useState("");
  const [newCustomHours, setNewCustomHours] = useState(16);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [protocolToDelete, setProtocolToDelete] = useState<Protocol | null>(
    null
  );

  // Load custom protocols and preferences
  useEffect(() => {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      const profile = JSON.parse(stored);
      if (profile.preferredProtocol) {
        setSelectedProtocol(profile.preferredProtocol);
      }
      if (profile.notifications !== undefined) {
        setShowTips(profile.notifications.dailyTips ?? true);
      }
      if (profile.customProtocols) {
        setCustomProtocols(profile.customProtocols);
      }
    }
  }, [userId]);

  // Save custom protocol
  const saveCustomProtocol = () => {
    if (!newCustomName.trim() || newCustomHours < 1) return;

    const newProtocol: Protocol = {
      id: `custom_${Date.now()}`,
      name: newCustomName.trim(),
      fastingHours: newCustomHours,
      eatingHours: 24 - newCustomHours,
      description: `Custom ${newCustomHours}h fast`,
      isCustom: true,
    };

    const updated = [...customProtocols, newProtocol];
    setCustomProtocols(updated);

    // Save to profile
    const stored = localStorage.getItem(`profile_${userId}`);
    const profile = stored ? JSON.parse(stored) : {};
    profile.customProtocols = updated;
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));

    setSelectedProtocol(newProtocol.id);
    setNewCustomName("");
    setNewCustomHours(16);
    setShowCustomModal(false);
  };

  // Delete custom protocol
  const handleDeleteClick = (protocolId: string) => {
    const protocol = customProtocols.find((p) => p.id === protocolId);
    if (protocol) {
      setProtocolToDelete(protocol);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteProtocol = () => {
    if (!protocolToDelete) return;

    const updated = customProtocols.filter((p) => p.id !== protocolToDelete.id);
    setCustomProtocols(updated);

    const stored = localStorage.getItem(`profile_${userId}`);
    const profile = stored ? JSON.parse(stored) : {};
    profile.customProtocols = updated;
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));

    if (selectedProtocol === protocolToDelete.id) {
      setSelectedProtocol("16:8");
    }

    setShowDeleteConfirm(false);
    setProtocolToDelete(null);
  };

  const cancelDeleteProtocol = () => {
    setShowDeleteConfirm(false);
    setProtocolToDelete(null);
  };

  // All available protocols (built-in + custom)
  const allProtocols = [
    ...PROTOCOLS.filter((p) => p.id !== "custom"),
    ...customProtocols,
  ];

  useEffect(() => {
    if (!activeFast) {
      setElapsedTime("00:00:00");
      setElapsedMinutes(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(activeFast.startTime);
      const diff = now.getTime() - start.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedMinutes(hours * 60 + minutes);
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const handleStartFast = () => {
    const newFast: Fast = {
      id: Date.now().toString(),
      startTime: new Date(),
      endTime: null,
      duration: 0,
      status: "active",
      notes: notes || undefined,
      protocol: selectedProtocol,
    };
    onStartFast(newFast);
    setNotes("");
  };

  const handleEndFast = () => {
    setShowEndModal(true);
  };

  const confirmEndFast = () => {
    if (activeFast) {
      onEndFast(activeFast.id, endMood, endEnergy);
      setShowEndModal(false);
      setEndMood(3);
      setEndEnergy(3);
    }
  };

  const currentProtocol =
    allProtocols.find(
      (p) => p.id === (activeFast?.protocol || selectedProtocol)
    ) || PROTOCOLS[0];
  const targetMinutes = currentProtocol
    ? currentProtocol.fastingHours * 60
    : 16 * 60;
  const progress = activeFast
    ? Math.min((elapsedMinutes / targetMinutes) * 100, 100)
    : 0;

  // Calculate time remaining
  const remainingMinutes = Math.max(0, targetMinutes - elapsedMinutes);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = Math.floor(remainingMinutes % 60);
  const isGoalReached = elapsedMinutes >= targetMinutes;

  const elapsedHours = elapsedMinutes / 60;
  const currentZone: FastingZone =
    FASTING_ZONES.find(
      (zone: FastingZone) =>
        elapsedHours >= zone.minHours && elapsedHours < zone.maxHours
    ) || FASTING_ZONES[0];
  const nextZone: FastingZone | undefined = FASTING_ZONES.find(
    (zone: FastingZone) => zone.minHours > elapsedHours
  );

  return (
    <>
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${
            activeFast ? theme.colors.accent + "40" : theme.colors.border
          }`,
          padding: "48px 40px",
          textAlign: "center",
          transition: "border-color 0.3s ease",
        }}
      >
        {activeFast ? (
          <>
            {/* Active Fast State */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: theme.colors.accent,
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: theme.colors.accent,
                }}
              >
                {currentZone.name}
              </span>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
              }}
            >
              {currentZone.description}
            </div>

            <div
              style={{
                fontSize: "clamp(48px, 10vw, 72px)",
                fontWeight: 300,
                letterSpacing: "-0.02em",
                fontFamily: '"SF Mono", "Fira Code", monospace',
                marginBottom: "16px",
                color: theme.colors.accent,
              }}
            >
              {elapsedTime}
            </div>

            <div
              style={{
                maxWidth: "400px",
                margin: "0 auto 16px auto",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  backgroundColor: theme.colors.border,
                  marginBottom: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    backgroundColor: theme.colors.accent,
                    transition: "width 1s linear",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: theme.colors.textMuted,
                }}
              >
                <span>0h</span>
                <span
                  style={{
                    color:
                      progress >= 100
                        ? theme.colors.accent
                        : theme.colors.textMuted,
                  }}
                >
                  {progress >= 100
                    ? "✓ Goal reached!"
                    : `${Math.round(progress)}% to goal`}
                </span>
                <span>{currentProtocol?.fastingHours}h</span>
              </div>
            </div>

            {/* Time Remaining Card */}
            {!isGoalReached && (
              <div
                style={{
                  maxWidth: "400px",
                  margin: "0 auto 24px auto",
                  padding: "16px 20px",
                  backgroundColor: theme.colors.accent + "10",
                  border: `1px solid ${theme.colors.accent}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: theme.colors.textMuted,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Time Remaining
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: theme.colors.accent,
                    }}
                  >
                    {remainingHours}h {remainingMins}m
                  </div>
                </div>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: `3px solid ${theme.colors.border}`,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Circular progress */}
                  <svg
                    width="60"
                    height="60"
                    style={{
                      position: "absolute",
                      transform: "rotate(-90deg)",
                    }}
                  >
                    <circle
                      cx="30"
                      cy="30"
                      r="27"
                      fill="none"
                      stroke={theme.colors.accent}
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 27}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 27 * (1 - progress / 100)
                      }`}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: theme.colors.text,
                    }}
                  >
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            )}

            {/* Fasting Zones Timeline */}
            <div
              style={{
                maxWidth: "400px",
                margin: "24px auto",
                padding: "16px",
                backgroundColor: theme.colors.bg,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "12px",
                  textAlign: "left",
                }}
              >
                Fasting Zones
              </div>
              <div style={{ display: "flex", gap: "2px" }}>
                {FASTING_ZONES.slice(0, 5).map(
                  (zone: FastingZone, i: number) => {
                    const isActive =
                      elapsedHours >= zone.minHours &&
                      elapsedHours < zone.maxHours;
                    const isPast = elapsedHours >= zone.maxHours;
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: "4px",
                          backgroundColor:
                            isPast || isActive
                              ? theme.colors.accent
                              : theme.colors.border,
                          opacity: isPast ? 0.4 : 1,
                          transition: "all 0.3s ease",
                        }}
                        title={`${zone.name}: ${zone.minHours}-${zone.maxHours}h`}
                      />
                    );
                  }
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: theme.colors.textMuted,
                  marginTop: "8px",
                }}
              >
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>24h</span>
              </div>
            </div>

            {nextZone && (
              <div
                style={{
                  fontSize: "13px",
                  color: theme.colors.textMuted,
                  marginBottom: "24px",
                  padding: "12px 16px",
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  display: "inline-block",
                }}
              >
                <span style={{ opacity: 0.7 }}>Next zone:</span>{" "}
                <span style={{ color: theme.colors.accent, fontWeight: 500 }}>
                  {nextZone.name}
                </span>
                <span style={{ opacity: 0.7 }}> in </span>
                <span style={{ color: theme.colors.text, fontWeight: 500 }}>
                  {Math.ceil((nextZone.minHours * 60 - elapsedMinutes) / 60)}h{" "}
                  {Math.round((nextZone.minHours * 60 - elapsedMinutes) % 60)}m
                </span>
                <div
                  style={{
                    fontSize: "11px",
                    color: theme.colors.textMuted,
                    marginTop: "4px",
                    opacity: 0.7,
                  }}
                >
                  {nextZone.description}
                </div>
              </div>
            )}

            <div
              style={{
                fontSize: "13px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
              }}
            >
              Started{" "}
              {new Date(activeFast.startTime).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            {/* Fasting Tips */}
            {showTips && (
              <div style={{ maxWidth: "400px", margin: "0 auto 32px auto" }}>
                <FastingTipDisplay
                  protocol={activeFast.protocol}
                  zone={currentZone.name.toLowerCase().replace(" ", "_")}
                />
              </div>
            )}

            <button
              onClick={handleEndFast}
              style={{
                padding: "16px 48px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.accent}`,
                color: theme.colors.accent,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.accent;
                e.currentTarget.style.color = accentTextColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = theme.colors.accent;
              }}
            >
              End Fast
            </button>
          </>
        ) : (
          <>
            {/* Idle State */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: theme.colors.textMuted,
                marginBottom: "32px",
              }}
            >
              Ready to Begin
            </div>

            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  maxWidth: "500px",
                  margin: "0 auto",
                }}
              >
                {/* Built-in protocols */}
                {PROTOCOLS.filter((p) => p.id !== "custom").map((protocol) => {
                  const isProProtocol = PRO_PROTOCOLS.includes(protocol.id);
                  const isLocked =
                    isProProtocol && !canAccessProtocol(protocol.id);

                  return (
                    <button
                      key={protocol.id}
                      onClick={() => {
                        if (isLocked) {
                          promptUpgrade("allProtocols");
                        } else {
                          setSelectedProtocol(protocol.id);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (selectedProtocol !== protocol.id) {
                          e.currentTarget.style.borderColor =
                            theme.colors.accent;
                          e.currentTarget.style.color = theme.colors.accent;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedProtocol !== protocol.id) {
                          e.currentTarget.style.borderColor =
                            theme.colors.border;
                          e.currentTarget.style.color = theme.colors.textMuted;
                        }
                      }}
                      style={{
                        padding: "12px 20px",
                        minWidth: "80px",
                        backgroundColor:
                          selectedProtocol === protocol.id
                            ? theme.colors.accent
                            : "transparent",
                        border: `1px solid ${
                          selectedProtocol === protocol.id
                            ? theme.colors.accent
                            : theme.colors.border
                        }`,
                        color:
                          selectedProtocol === protocol.id
                            ? accentTextColor
                            : theme.colors.textMuted,
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        opacity: isLocked ? 0.6 : 1,
                        position: "relative",
                      }}
                    >
                      {protocol.name}
                      {isLocked && (
                        <span
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            backgroundColor: theme.colors.bgCard,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={theme.colors.textMuted}
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Custom protocols */}
                {customProtocols.map((protocol) => (
                  <div key={protocol.id} style={{ position: "relative" }}>
                    <button
                      onClick={() => setSelectedProtocol(protocol.id)}
                      onMouseEnter={(e) => {
                        if (selectedProtocol !== protocol.id) {
                          e.currentTarget.style.borderColor =
                            theme.colors.accent;
                          e.currentTarget.style.color = theme.colors.accent;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedProtocol !== protocol.id) {
                          e.currentTarget.style.borderColor =
                            theme.colors.border;
                          e.currentTarget.style.color = theme.colors.textMuted;
                        }
                      }}
                      style={{
                        padding: "12px 20px",
                        minWidth: "80px",
                        backgroundColor:
                          selectedProtocol === protocol.id
                            ? theme.colors.accent
                            : "transparent",
                        border: `1px solid ${
                          selectedProtocol === protocol.id
                            ? theme.colors.accent
                            : theme.colors.border
                        }`,
                        color:
                          selectedProtocol === protocol.id
                            ? accentTextColor
                            : theme.colors.textMuted,
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {protocol.name}
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(protocol.id);
                      }}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: theme.colors.bg,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.textMuted,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                      title="Delete custom fast"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Add custom button */}
                <button
                  onClick={() => {
                    if (canAccessFeature("customFasts")) {
                      setShowCustomModal(true);
                    } else {
                      promptUpgrade("customFasts");
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.accent;
                    e.currentTarget.style.color = theme.colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                    e.currentTarget.style.color = theme.colors.textMuted;
                  }}
                  style={{
                    padding: "12px 20px",
                    minWidth: "80px",
                    backgroundColor: "transparent",
                    border: `1px dashed ${theme.colors.border}`,
                    color: theme.colors.textMuted,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: canAccessFeature("customFasts") ? 1 : 0.6,
                    position: "relative",
                  }}
                  title="Create custom fast"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Custom
                  {!canAccessFeature("customFasts") && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        backgroundColor: theme.colors.bgCard,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: "50%",
                        width: "16px",
                        height: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={theme.colors.textMuted}
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: theme.colors.textMuted,
                  marginTop: "12px",
                }}
              >
                {currentProtocol?.description}
              </div>
            </div>

            <div
              style={{
                fontSize: "clamp(48px, 10vw, 72px)",
                fontWeight: 300,
                letterSpacing: "-0.02em",
                fontFamily: '"SF Mono", "Fira Code", monospace',
                marginBottom: "32px",
                color: theme.colors.border,
              }}
            >
              00:00:00
            </div>

            <div
              style={{
                marginBottom: "24px",
                textAlign: "left",
                maxWidth: "400px",
                margin: "0 auto 24px auto",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What's your intention for this fast?"
                style={{
                  width: "100%",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "14px 16px",
                  color: theme.colors.text,
                  fontSize: "14px",
                  resize: "none",
                  height: "80px",
                  fontFamily: "inherit",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = theme.colors.accent)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = theme.colors.border)
                }
              />
            </div>

            <button
              onClick={handleStartFast}
              style={{
                padding: "18px 64px",
                backgroundColor: theme.colors.accent,
                border: "none",
                color: accentTextColor,
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Start Your Fast
            </button>
          </>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>

      {/* End Fast Modal */}
      {showEndModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              padding: "40px",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "8px",
                color: theme.colors.text,
              }}
            >
              End your fast?
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: theme.colors.textMuted,
                marginBottom: "32px",
              }}
            >
              You've fasted for{" "}
              <span style={{ color: theme.colors.accent, fontWeight: 600 }}>
                {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
              </span>
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "12px",
                }}
              >
                How do you feel?
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  {
                    value: 1,
                    label: "Struggling",
                    icon: (color: string) => (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 15s1.5-2 4-2 4 2 4 2" />
                        <line
                          x1="9"
                          y1="9"
                          x2="9.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="9"
                          x2="15.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    value: 2,
                    label: "Difficult",
                    icon: (color: string) => (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9 15s0.5-1 3-1 3 1 3 1" />
                        <line
                          x1="9"
                          y1="9"
                          x2="9.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="9"
                          x2="15.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    value: 3,
                    label: "Neutral",
                    icon: (color: string) => (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="15" x2="16" y2="15" />
                        <line
                          x1="9"
                          y1="9"
                          x2="9.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="9"
                          x2="15.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    value: 4,
                    label: "Good",
                    icon: (color: string) => (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line
                          x1="9"
                          y1="9"
                          x2="9.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="9"
                          x2="15.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                  {
                    value: 5,
                    label: "Great",
                    icon: (color: string) => (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 13s1.5 3 4 3 4-3 4-3" />
                        <line
                          x1="9"
                          y1="9"
                          x2="9.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="15"
                          y1="9"
                          x2="15.01"
                          y2="9"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setEndMood(item.value)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      backgroundColor:
                        endMood === item.value
                          ? theme.colors.accent
                          : theme.colors.bgCard,
                      border: `1px solid ${
                        endMood === item.value
                          ? theme.colors.accent
                          : theme.colors.border
                      }`,
                      color:
                        endMood === item.value
                          ? accentTextColor
                          : theme.colors.textMuted,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {item.icon(
                      endMood === item.value
                        ? accentTextColor
                        : theme.colors.textMuted
                    )}
                    <span style={{ fontSize: "9px", fontWeight: 500 }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: theme.colors.textMuted,
                  marginBottom: "12px",
                }}
              >
                Energy level?
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { value: 1, label: "Very Low" },
                  { value: 2, label: "Low" },
                  { value: 3, label: "Moderate" },
                  { value: 4, label: "High" },
                  { value: 5, label: "Energized" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setEndEnergy(item.value)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      backgroundColor:
                        endEnergy === item.value
                          ? theme.colors.accent
                          : theme.colors.bgCard,
                      border: `1px solid ${
                        endEnergy === item.value
                          ? theme.colors.accent
                          : theme.colors.border
                      }`,
                      color:
                        endEnergy === item.value
                          ? accentTextColor
                          : theme.colors.textMuted,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                    </svg>
                    <span style={{ fontSize: "9px", fontWeight: 500 }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={confirmEndFast}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: theme.colors.accent,
                  border: "none",
                  color: accentTextColor,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                End Fast
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Protocol Modal */}
      {showCustomModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "8px",
                color: theme.colors.text,
              }}
            >
              Create Custom Fast
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
              }}
            >
              Set up your own fasting protocol
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="e.g., 2MAD, My Fast"
                maxLength={20}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: theme.colors.bg,
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme.colors.textMuted,
                  marginBottom: "8px",
                }}
              >
                Fasting Hours: {newCustomHours}h
              </label>
              <input
                type="range"
                min="1"
                max="72"
                value={newCustomHours}
                onChange={(e) => setNewCustomHours(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: theme.colors.accent,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: theme.colors.textMuted,
                  marginTop: "4px",
                }}
              >
                <span>1h</span>
                <span>72h</span>
              </div>
            </div>

            <div
              style={{
                padding: "16px",
                backgroundColor: theme.colors.bg,
                border: `1px solid ${theme.colors.border}`,
                marginBottom: "24px",
              }}
            >
              <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
                Fast for{" "}
                <span style={{ color: theme.colors.accent, fontWeight: 600 }}>
                  {newCustomHours} hours
                </span>
                {newCustomHours < 24 && (
                  <>
                    , eat within{" "}
                    <span style={{ color: theme.colors.text, fontWeight: 600 }}>
                      {24 - newCustomHours} hours
                    </span>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCustomModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveCustomProtocol}
                disabled={!newCustomName.trim()}
                onMouseEnter={(e) => {
                  if (newCustomName.trim()) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: newCustomName.trim()
                    ? theme.colors.accent
                    : theme.colors.border,
                  border: "none",
                  color: newCustomName.trim()
                    ? accentTextColor
                    : theme.colors.textMuted,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: newCustomName.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && protocolToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
          }}
          onClick={cancelDeleteProtocol}
        >
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#F43F5E20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Delete Custom Fast?
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: theme.colors.textMuted,
                textAlign: "center",
                marginBottom: "24px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete "
              <span style={{ color: theme.colors.text, fontWeight: 500 }}>
                {protocolToDelete.name}
              </span>
              "? This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={cancelDeleteProtocol}
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
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProtocol}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: "#F43F5E",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
