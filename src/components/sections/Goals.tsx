import { useState, useEffect } from "react";
import { PROTOCOLS, ACHIEVEMENTS, ACHIEVEMENT_TIERS } from "../../types";
import type {
  UserProfile,
  AchievementCategory,
  AchievementTier,
} from "../../types";
import { useTheme } from "../../context/ThemeContext";
import AchievementIcon from "../ui/AchievementIcon";

interface GoalsProps {
  userId: string;
}

export default function Goals({ userId }: GoalsProps) {
  const { theme } = useTheme();
  const accentTextColor = theme.accent === "default" ? "#0B0B0C" : "#FFFFFF";
  const [profile, setProfile] = useState<UserProfile>({
    dailyGoal: 16,
    weeklyGoal: 112,
    preferredProtocol: "16:8",
    weightUnit: "kg",
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [activeTab, setActiveTab] = useState<"goals" | "achievements">("goals");
  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | "all"
  >("all");
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);

  const handleTabChange = (tab: "goals" | "achievements") => {
    if (tab === activeTab) return;
    setIsTabTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsTabTransitioning(false);
    }, 150);
  };

  useEffect(() => {
    const stored = localStorage.getItem(`profile_${userId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile(parsed);
      setTempProfile(parsed);
    }
  }, [userId]);

  const handleSave = () => {
    localStorage.setItem(`profile_${userId}`, JSON.stringify(tempProfile));
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const selectProtocol = (protocolId: string) => {
    const protocol = PROTOCOLS.find((p) => p.id === protocolId);
    if (protocol && protocol.id !== "custom") {
      setTempProfile({
        ...tempProfile,
        preferredProtocol: protocolId,
        dailyGoal: protocol.fastingHours,
        weeklyGoal: protocol.fastingHours * 7,
      });
    }
  };

  const selectedProtocol = PROTOCOLS.find(
    (p) => p.id === tempProfile.preferredProtocol
  );

  const filteredAchievements =
    selectedCategory === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === selectedCategory);

  const getCategoryCount = (cat: AchievementCategory | "all") => {
    if (cat === "all") return ACHIEVEMENTS.length;
    return ACHIEVEMENTS.filter((a) => a.category === cat).length;
  };

  const getUnlockedCount = (cat: AchievementCategory | "all") => {
    const achievements =
      cat === "all"
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter((a) => a.category === cat);
    return achievements.filter((a) => profile.achievements?.includes(a.id))
      .length;
  };

  const categories: { id: AchievementCategory | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "general", label: "General" },
    { id: "streak", label: "Streaks" },
    { id: "milestone", label: "Milestones" },
    { id: "16:8", label: "16:8" },
    { id: "18:6", label: "18:6" },
    { id: "20:4", label: "20:4" },
    { id: "omad", label: "OMAD" },
    { id: "water", label: "Water" },
    { id: "special", label: "Special" },
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Main Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "32px",
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {[
          { id: "goals", label: "Goals" },
          { id: "achievements", label: "Achievements" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as typeof activeTab)}
            style={{
              padding: "16px 24px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? `2px solid ${theme.colors.text}`
                  : "2px solid transparent",
              color:
                activeTab === tab.id
                  ? theme.colors.text
                  : theme.colors.textMuted,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content with Transition */}
      <div
        style={{
          opacity: isTabTransitioning ? 0 : 1,
          transform: isTabTransitioning ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.15s ease, transform 0.15s ease",
        }}
      >
        {/* Goals Tab */}
        {activeTab === "goals" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "32px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: theme.colors.text,
                    marginBottom: "4px",
                  }}
                >
                  Fasting Goals
                </h2>
                <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
                  Set your daily and weekly targets.
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    border: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <>
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
                    Protocol
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {PROTOCOLS.filter((p) => p.id !== "custom").map(
                      (protocol) => (
                        <button
                          key={protocol.id}
                          onClick={() => selectProtocol(protocol.id)}
                          style={{
                            padding: "16px",
                            backgroundColor:
                              tempProfile.preferredProtocol === protocol.id
                                ? theme.colors.bgHover
                                : theme.colors.bgCard,
                            border: `1px solid ${
                              tempProfile.preferredProtocol === protocol.id
                                ? theme.colors.text
                                : theme.colors.border
                            }`,
                            color: theme.colors.text,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              marginBottom: "4px",
                            }}
                          >
                            {protocol.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: theme.colors.textMuted,
                            }}
                          >
                            {protocol.fastingHours}h fast /{" "}
                            {protocol.eatingHours}h eat
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ marginBottom: "24px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Daily target
                      </span>
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: 600,
                          color: theme.colors.text,
                        }}
                      >
                        {tempProfile.dailyGoal}h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="23"
                      value={tempProfile.dailyGoal}
                      onChange={(e) =>
                        setTempProfile({
                          ...tempProfile,
                          dailyGoal: Number(e.target.value),
                          preferredProtocol: "custom",
                        })
                      }
                      style={{
                        width: "100%",
                        height: "4px",
                        appearance: "none",
                        backgroundColor: theme.colors.border,
                        cursor: "pointer",
                      }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Weekly target
                      </span>
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: 600,
                          color: theme.colors.text,
                        }}
                      >
                        {tempProfile.weeklyGoal}h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="56"
                      max="161"
                      step="7"
                      value={tempProfile.weeklyGoal}
                      onChange={(e) =>
                        setTempProfile({
                          ...tempProfile,
                          weeklyGoal: Number(e.target.value),
                          preferredProtocol: "custom",
                        })
                      }
                      style={{
                        width: "100%",
                        height: "4px",
                        appearance: "none",
                        backgroundColor: theme.colors.border,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={handleSave}
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
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    style={{
                      flex: 1,
                      padding: "14px",
                      backgroundColor: "transparent",
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: theme.colors.textMuted,
                      marginBottom: "8px",
                    }}
                  >
                    Protocol
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 600,
                      color: theme.colors.accent,
                    }}
                  >
                    {selectedProtocol?.name}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: theme.colors.bgCard,
                    border: `1px solid ${theme.colors.border}`,
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: theme.colors.textMuted,
                      marginBottom: "8px",
                    }}
                  >
                    Daily
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 600,
                      color: theme.colors.accent,
                    }}
                  >
                    {profile.dailyGoal}h
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: theme.colors.text,
                    marginBottom: "4px",
                  }}
                >
                  Achievements
                </h2>
                <p style={{ color: theme.colors.textMuted, fontSize: "14px" }}>
                  {getUnlockedCount("all")} of {getCategoryCount("all")}{" "}
                  unlocked
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                {(Object.keys(ACHIEVEMENT_TIERS) as AchievementTier[]).map(
                  (tier) => (
                    <div
                      key={tier}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          backgroundColor: ACHIEVEMENT_TIERS[tier].color,
                          borderRadius:
                            tier === "bronze"
                              ? "50%"
                              : tier === "silver"
                              ? "0"
                              : "2px",
                          transform:
                            tier === "silver"
                              ? "rotate(45deg) scale(0.8)"
                              : "none",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "10px",
                          color: theme.colors.textMuted,
                          textTransform: "capitalize",
                        }}
                      >
                        {tier}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Category Tabs - Modern Pill Style Scroller */}
            <div
              style={{
                position: "relative",
                marginBottom: "24px",
              }}
            >
              {/* Left scroll arrow */}
              <button
                onClick={() => {
                  const scroller = document.getElementById(
                    "achievement-scroller"
                  );
                  if (scroller)
                    scroller.scrollBy({ left: -200, behavior: "smooth" });
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "36px",
                  height: "36px",
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 3,
                  transition: "all 0.2s ease",
                  boxShadow: `2px 0 8px ${theme.colors.bg}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.accent;
                  e.currentTarget.style.borderColor = theme.colors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bgCard;
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors.text}
                  strokeWidth="2"
                >
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>

              {/* Right scroll arrow */}
              <button
                onClick={() => {
                  const scroller = document.getElementById(
                    "achievement-scroller"
                  );
                  if (scroller)
                    scroller.scrollBy({ left: 200, behavior: "smooth" });
                }}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "36px",
                  height: "36px",
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 3,
                  transition: "all 0.2s ease",
                  boxShadow: `-2px 0 8px ${theme.colors.bg}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.accent;
                  e.currentTarget.style.borderColor = theme.colors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.bgCard;
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors.text}
                  strokeWidth="2"
                >
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>

              {/* Scrollable container */}
              <div
                id="achievement-scroller"
                className="achievement-scroller"
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  padding: "8px 48px",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const unlocked = getUnlockedCount(cat.id);
                  const total = getCategoryCount(cat.id);
                  const isComplete = unlocked === total && total > 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: isActive
                          ? theme.colors.accent
                          : "transparent",
                        border: `1px solid ${
                          isActive ? theme.colors.accent : theme.colors.border
                        }`,
                        borderRadius: "50px",
                        color: isActive
                          ? accentTextColor
                          : theme.colors.textMuted,
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexShrink: 0,
                        transform: isActive ? "scale(1.02)" : "scale(1)",
                        boxShadow: isActive
                          ? `0 4px 12px ${theme.colors.accent}30`
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor =
                            theme.colors.accent + "60";
                          e.currentTarget.style.color = theme.colors.text;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor =
                            theme.colors.border;
                          e.currentTarget.style.color = theme.colors.textMuted;
                        }
                      }}
                    >
                      <span>{cat.label}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: isActive
                            ? "rgba(0,0,0,0.15)"
                            : isComplete
                            ? theme.colors.accent + "20"
                            : theme.colors.bgCard,
                          color:
                            isComplete && !isActive
                              ? theme.colors.accent
                              : "inherit",
                          padding: "3px 8px",
                          borderRadius: "20px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {isComplete && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                        {unlocked}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hide scrollbar CSS */}
              <style>{`
              .achievement-scroller::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            </div>

            {/* Achievements Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredAchievements.map((achievement) => {
                const isUnlocked = profile.achievements?.includes(
                  achievement.id
                );
                const tierInfo = ACHIEVEMENT_TIERS[achievement.tier];

                return (
                  <div
                    key={achievement.id}
                    style={{
                      backgroundColor: isUnlocked
                        ? tierInfo.bgColor
                        : theme.colors.bgCard,
                      border: `1px solid ${
                        isUnlocked ? tierInfo.color + "40" : theme.colors.border
                      }`,
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.3s ease",
                      cursor: "default",
                    }}
                  >
                    <AchievementIcon
                      category={achievement.category}
                      tier={achievement.tier}
                      size={52}
                      unlocked={isUnlocked}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: isUnlocked
                              ? theme.colors.text
                              : theme.colors.textMuted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {achievement.name}
                        </span>
                        {isUnlocked && (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={tierInfo.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: theme.colors.textMuted,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAchievements.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: theme.colors.textMuted,
                }}
              >
                No achievements in this category.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
