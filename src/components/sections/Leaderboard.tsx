import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  getLeaderboard,
  updateLeaderboardEntry,
  calculateLeaderboardStats,
  type LeaderboardEntry,
  type LeaderboardCategory,
} from "../../services/leaderboard";

interface LeaderboardProps {
  userId: string;
  fasts: any[];
}

const CATEGORIES: { id: LeaderboardCategory; label: string; suffix: string }[] =
  [
    { id: "totalHours", label: "Total Hours", suffix: "h" },
    { id: "totalFasts", label: "Total Fasts", suffix: "" },
    { id: "currentStreak", label: "Current Streak", suffix: "d" },
    { id: "longestFast", label: "Longest Fast", suffix: "m" },
  ];

export default function Leaderboard({ userId, fasts }: LeaderboardProps) {
  const { theme } = useTheme();
  const { canAccessFeature, promptUpgrade } = useSubscription();
  const accentTextColor =
    theme.mode === "light"
      ? theme.accent === "default"
        ? "#FFFFFF"
        : "#FFFFFF"
      : theme.accent === "default"
      ? "#0B0B0C"
      : "#FFFFFF";
  const [activeCategory, setActiveCategory] =
    useState<LeaderboardCategory>("totalHours");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userOptedIn, setUserOptedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userRank, setUserRank] = useState<number | null>(null);
  const [showOptInModal, setShowOptInModal] = useState(false);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);

  const handleCategoryChange = (category: LeaderboardCategory) => {
    if (category === activeCategory) return;
    setIsTabTransitioning(true);
    setTimeout(() => {
      setActiveCategory(category);
      setIsTabTransitioning(false);
    }, 150);
  };

  // Load user profile and opt-in status
  useEffect(() => {
    try {
      const profile = localStorage.getItem(`profile_${userId}`);
      if (profile) {
        const parsed = JSON.parse(profile);
        setUserOptedIn(parsed.leaderboardOptIn || false);
        setDisplayName(parsed.displayName || "");
      }
    } catch (e) {
      console.error("Error loading profile:", e);
    }
  }, [userId]);

  // Fetch leaderboard
  useEffect(() => {
    let mounted = true;

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await getLeaderboard(activeCategory, 50);

        if (!mounted) return;

        setLeaderboard(data);

        // Find user rank
        const userIndex = data.findIndex((entry) => entry.odId === userId);
        setUserRank(userIndex >= 0 ? userIndex + 1 : null);
      } catch (e) {
        console.error("Error fetching leaderboard:", e);
        if (mounted) {
          setError("Could not load leaderboard. Please check your connection.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();

    return () => {
      mounted = false;
    };
  }, [activeCategory, userId]);

  // Handle opt-in
  const handleOptIn = async () => {
    if (!displayName.trim()) return;

    try {
      const profile = localStorage.getItem(`profile_${userId}`);
      const parsed = profile ? JSON.parse(profile) : {};

      const updatedProfile = {
        ...parsed,
        leaderboardOptIn: true,
        displayName: displayName.trim(),
      };

      localStorage.setItem(`profile_${userId}`, JSON.stringify(updatedProfile));
      setUserOptedIn(true);
      setShowOptInModal(false);

      // Update leaderboard
      const stats = calculateLeaderboardStats(fasts, updatedProfile);
      await updateLeaderboardEntry(userId, { ...stats, isPublic: true });

      // Refresh
      const data = await getLeaderboard(activeCategory, 50);
      setLeaderboard(data);

      const userIndex = data.findIndex((entry) => entry.odId === userId);
      setUserRank(userIndex >= 0 ? userIndex + 1 : null);
    } catch (e) {
      console.error("Error opting in:", e);
    }
  };

  // Handle opt-out
  const handleOptOut = async () => {
    try {
      const profile = localStorage.getItem(`profile_${userId}`);
      const parsed = profile ? JSON.parse(profile) : {};

      const updatedProfile = {
        ...parsed,
        leaderboardOptIn: false,
      };

      localStorage.setItem(`profile_${userId}`, JSON.stringify(updatedProfile));
      setUserOptedIn(false);
      setUserRank(null);

      // Update with isPublic false
      const stats = calculateLeaderboardStats(fasts, updatedProfile);
      await updateLeaderboardEntry(userId, { ...stats, isPublic: false });

      // Refresh
      const data = await getLeaderboard(activeCategory, 50);
      setLeaderboard(data);
    } catch (e) {
      console.error("Error opting out:", e);
    }
  };

  const formatValue = (
    entry: LeaderboardEntry,
    category: LeaderboardCategory
  ): string => {
    switch (category) {
      case "totalHours":
        return `${entry.totalHours}h`;
      case "totalFasts":
        return `${entry.totalFasts}`;
      case "currentStreak":
        return `${entry.currentStreak}d`;
      case "longestFast":
        const hours = Math.floor(entry.longestFast / 60);
        const mins = entry.longestFast % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      default:
        return "";
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: "#FFD700", fontWeight: 700 as const };
    if (rank === 2) return { color: "#C0C0C0", fontWeight: 600 as const };
    if (rank === 3) return { color: "#CD7F32", fontWeight: 600 as const };
    return { color: theme.colors.textMuted, fontWeight: 500 as const };
  };

  // Check if user has access to leaderboard
  if (!canAccessFeature("leaderboard")) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: theme.colors.text,
              marginBottom: "4px",
            }}
          >
            Leaderboard
          </h2>
          <p style={{ fontSize: "14px", color: theme.colors.textMuted }}>
            See how you rank against other fasters
          </p>
        </div>

        {/* Locked State */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            padding: "60px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: theme.colors.bg,
              border: `1px solid ${theme.colors.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.textMuted}
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: theme.colors.text,
              marginBottom: "8px",
            }}
          >
            Leaderboard is a Pro Feature
          </h3>

          <p
            style={{
              fontSize: "14px",
              color: theme.colors.textMuted,
              marginBottom: "24px",
              maxWidth: "300px",
              margin: "0 auto 24px",
              lineHeight: 1.5,
            }}
          >
            Upgrade to Pro to compete with other fasters and see your global
            ranking.
          </p>

          <button
            onClick={() => promptUpgrade("leaderboard")}
            style={{
              padding: "14px 28px",
              backgroundColor: theme.colors.text,
              border: "none",
              color: theme.colors.bg,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: theme.colors.text,
            marginBottom: "4px",
          }}
        >
          Leaderboard
        </h2>
        <p style={{ fontSize: "14px", color: theme.colors.textMuted }}>
          See how you rank against other fasters
        </p>
      </div>

      {/* Opt-in banner */}
      {!userOptedIn && (
        <div
          style={{
            backgroundColor: theme.colors.accent + "10",
            border: `1px solid ${theme.colors.accent}30`,
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: theme.colors.text,
                marginBottom: "2px",
              }}
            >
              Join the leaderboard
            </div>
            <div style={{ fontSize: "13px", color: theme.colors.textMuted }}>
              Compete with other fasters and track your ranking
            </div>
          </div>
          <button
            onClick={() => setShowOptInModal(true)}
            style={{
              padding: "10px 20px",
              backgroundColor: theme.colors.accent,
              border: "none",
              color: accentTextColor,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Join Now
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            style={{
              padding: "10px 16px",
              backgroundColor:
                activeCategory === cat.id
                  ? theme.colors.accent + "20"
                  : "transparent",
              border: `1px solid ${
                activeCategory === cat.id
                  ? theme.colors.accent
                  : theme.colors.border
              }`,
              color:
                activeCategory === cat.id
                  ? theme.colors.accent
                  : theme.colors.textMuted,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content with Transition */}
      <div
        style={{
          opacity: isTabTransitioning ? 0 : 1,
          transform: isTabTransitioning ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.15s ease, transform 0.15s ease",
        }}
      >
        {/* User's rank card */}
        {userOptedIn && userRank && (
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.accent}40`,
              padding: "16px 20px",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: theme.colors.accent + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                #{userRank}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: theme.colors.text,
                  }}
                >
                  Your Rank
                </div>
                <div
                  style={{ fontSize: "12px", color: theme.colors.textMuted }}
                >
                  {displayName}
                </div>
              </div>
            </div>
            <button
              onClick={handleOptOut}
              style={{
                padding: "8px 12px",
                backgroundColor: "transparent",
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textMuted,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Leave
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: "#FF000010",
              border: "1px solid #FF000030",
              padding: "16px",
              marginBottom: "16px",
              color: "#FF6B6B",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Leaderboard list */}
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: theme.colors.textMuted,
              }}
            >
              Loading...
            </div>
          ) : leaderboard.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: theme.colors.textMuted,
              }}
            >
              No entries yet. Be the first to join!
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.odId === userId;

              return (
                <div
                  key={entry.odId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderBottom:
                      index < leaderboard.length - 1
                        ? `1px solid ${theme.colors.border}`
                        : "none",
                    backgroundColor: isCurrentUser
                      ? theme.colors.accent + "08"
                      : "transparent",
                  }}
                >
                  {/* Rank */}
                  <div
                    style={{
                      width: "40px",
                      fontSize: "14px",
                      ...getRankStyle(rank),
                    }}
                  >
                    {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: isCurrentUser ? 600 : 400,
                        color: isCurrentUser
                          ? theme.colors.accent
                          : theme.colors.text,
                      }}
                    >
                      {entry.displayName}
                      {isCurrentUser && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            opacity: 0.7,
                          }}
                        >
                          (You)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: theme.colors.text,
                    }}
                  >
                    {formatValue(entry, activeCategory)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Opt-in Modal */}
      {showOptInModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
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
                color: theme.colors.text,
                marginBottom: "8px",
              }}
            >
              Join the Leaderboard
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
              }}
            >
              Choose a display name that others will see. Your fasting stats
              will be visible to all users.
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
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
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

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowOptInModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOptIn}
                disabled={!displayName.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: displayName.trim()
                    ? theme.colors.accent
                    : theme.colors.border,
                  border: "none",
                  color: displayName.trim()
                    ? accentTextColor
                    : theme.colors.textMuted,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: displayName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
