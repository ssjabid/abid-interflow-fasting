import { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { useFasts } from "./context/FastContext";
import { useTheme } from "./context/ThemeContext";
import { useAchievements } from "./context/AchievementContext";
import type { UserProfile } from "./types";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import Dashboard from "./components/sections/Dashboard";
import History from "./components/sections/History";
import Statistics from "./components/sections/Statistics";
import Goals from "./components/sections/Goals";
import Leaderboard from "./components/sections/Leaderboard";
import Settings from "./components/sections/Settings";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import Onboarding from "./components/Onboarding";
import AchievementUnlock from "./components/ui/AchievementUnlock";
import InstallPrompt from "./components/ui/InstallPrompt";
import { loadProfile } from "./services/profile";

type View =
  | "dashboard"
  | "history"
  | "statistics"
  | "goals"
  | "leaderboard"
  | "settings";

function App() {
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { fasts, activeFast, startFast, endFast, deleteFast } = useFasts();
  const { theme } = useTheme();
  const { checkForNewAchievements, pendingUnlock, dismissUnlock } =
    useAchievements();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [signupModalVisible, setSignupModalVisible] = useState(false);
  const prevUserRef = useRef<string | null>(null);

  // Handle modal open with animation
  const openLogin = () => {
    setShowLogin(true);
    setTimeout(() => setLoginModalVisible(true), 10);
  };

  const closeLogin = () => {
    setLoginModalVisible(false);
    setTimeout(() => setShowLogin(false), 300);
  };

  const closeSignup = () => {
    setSignupModalVisible(false);
    setTimeout(() => setShowSignup(false), 300);
  };

  const switchToSignup = () => {
    setLoginModalVisible(false);
    setTimeout(() => {
      setShowLogin(false);
      setShowSignup(true);
      setTimeout(() => setSignupModalVisible(true), 10);
    }, 200);
  };

  const switchToLogin = () => {
    setSignupModalVisible(false);
    setTimeout(() => {
      setShowSignup(false);
      setShowLogin(true);
      setTimeout(() => setLoginModalVisible(true), 10);
    }, 200);
  };

  // Handle view change with transition
  const handleViewChange = (view: View) => {
    if (view === currentView) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
    }, 150);
  };

  // Show loading screen on initial load only (not logged in)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      // Initial app load for non-logged-in users
      const timer = setTimeout(() => {
        setShowLoadingScreen(false);
        setAppReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, currentUser]);

  // Show loading screen when user logs in (post-auth)
  useEffect(() => {
    if (currentUser && prevUserRef.current !== currentUser.uid) {
      // User just logged in - show post-auth loading
      setShowLoadingScreen(true);
      setAppReady(false);

      // Close any open modals
      setShowLogin(false);
      setShowSignup(false);
      setLoginModalVisible(false);
      setSignupModalVisible(false);

      // Reset to dashboard
      setCurrentView("dashboard");

      // Show loading for 1.5 seconds
      const timer = setTimeout(() => {
        setShowLoadingScreen(false);
        setAppReady(true);
      }, 1500);

      prevUserRef.current = currentUser.uid;
      return () => clearTimeout(timer);
    } else if (!currentUser) {
      prevUserRef.current = null;
    }
  }, [currentUser]);
  const lastFastCountRef = useRef(0);

  // Check if user needs onboarding (from Firebase)
  useEffect(() => {
    const checkOnboarding = async () => {
      if (currentUser) {
        const profile = await loadProfile(currentUser.uid);
        if (!profile || !profile.onboardingComplete) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      }
    };
    checkOnboarding();
  }, [currentUser]);

  // Check for achievements when fasts change
  useEffect(() => {
    if (!currentUser) return;

    const completedFasts = fasts.filter((f) => f.status === "completed");
    const currentCount = completedFasts.length;

    // Only check when count increases (new fast completed)
    if (currentCount <= lastFastCountRef.current) {
      lastFastCountRef.current = currentCount;
      return;
    }
    lastFastCountRef.current = currentCount;

    const profileStr = localStorage.getItem(`profile_${currentUser.uid}`);
    if (!profileStr) return;

    const profile: UserProfile = JSON.parse(profileStr);
    const newUnlocks = checkForNewAchievements(fasts, profile);

    if (newUnlocks.length > 0) {
      // Save new achievements to profile
      const updated = [...(profile.achievements || []), ...newUnlocks];
      localStorage.setItem(
        `profile_${currentUser.uid}`,
        JSON.stringify({
          ...profile,
          achievements: updated,
        })
      );
    }
  }, [fasts, currentUser, checkForNewAchievements]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Handle logout - reset to dashboard
  const handleLogout = async () => {
    setCurrentView("dashboard");
    await logout();
  };

  // Calculate stats for sharing
  const completedFasts = fasts.filter((f) => f.status === "completed");
  const totalHours = completedFasts.reduce(
    (acc, f) => acc + f.duration / 60,
    0
  );

  // Update body background on theme change
  useEffect(() => {
    document.body.style.backgroundColor = theme.colors.bg;
    document.body.style.color = theme.colors.text;
    document.body.style.transition =
      "background-color 0.3s ease, color 0.3s ease";
  }, [theme.colors.bg, theme.colors.text]);

  // Calculate streak
  const calculateStreak = () => {
    if (completedFasts.length === 0) return 0;
    const sortedFasts = [...completedFasts].sort(
      (a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime()
    );
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const fast of sortedFasts) {
      const fastDate = new Date(fast.endTime!);
      fastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (currentDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 1) {
        streak++;
        currentDate = fastDate;
      } else {
        break;
      }
    }
    return streak;
  };

  // Loading screen
  if (showLoadingScreen || !appReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: theme.colors.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
          opacity: 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            fontSize: "32px",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: theme.colors.text,
            animation: "fadeIn 0.5s ease",
          }}
        >
          Interflow
        </div>

        {/* Modern spinner */}
        <div
          style={{
            position: "relative",
            width: "48px",
            height: "48px",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              border: `3px solid ${theme.colors.border}`,
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              border: "3px solid transparent",
              borderTopColor: theme.colors.accent,
              borderRadius: "50%",
              animation: "spin 0.8s ease-in-out infinite",
            }}
          />
        </div>

        <div
          style={{
            fontSize: "13px",
            color: theme.colors.textMuted,
            letterSpacing: "0.05em",
          }}
        >
          {currentUser ? "Loading your data..." : "Initializing..."}
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.bg,
        color: theme.colors.text,
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {currentUser ? (
        <>
          {showOnboarding ? (
            <Onboarding
              userId={currentUser.uid}
              onComplete={handleOnboardingComplete}
            />
          ) : (
            <>
              {/* Logged-in Navigation */}
              <nav
                style={{
                  borderBottom: `1px solid ${theme.colors.border}`,
                  position: "sticky",
                  top: 0,
                  backgroundColor: theme.colors.bg,
                  zIndex: 100,
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: theme.colors.text,
                    }}
                  >
                    Interflow
                  </div>

                  <button
                    onClick={handleLogout}
                    style={{
                      padding: "10px 24px",
                      backgroundColor: "transparent",
                      border: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                      fontSize: "13px",
                      fontWeight: 500,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.text;
                      e.currentTarget.style.backgroundColor =
                        theme.colors.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border;
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Logout
                  </button>
                </div>
              </nav>

              <Navigation
                currentView={currentView}
                onViewChange={handleViewChange}
              />

              <main
                className="main-content"
                style={{
                  maxWidth: "1200px",
                  margin: "0 auto",
                  opacity: isTransitioning ? 0 : 1,
                  transform: isTransitioning
                    ? "translateY(10px)"
                    : "translateY(0)",
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                }}
              >
                {currentView === "dashboard" && (
                  <Dashboard
                    fasts={fasts}
                    activeFast={activeFast}
                    onStartFast={startFast}
                    onEndFast={endFast}
                    userId={currentUser.uid}
                  />
                )}

                {currentView === "history" && (
                  <History fasts={fasts} onDeleteFast={deleteFast} />
                )}

                {currentView === "statistics" && <Statistics fasts={fasts} />}

                {currentView === "goals" && <Goals userId={currentUser.uid} />}

                {currentView === "leaderboard" && (
                  <Leaderboard userId={currentUser.uid} fasts={fasts} />
                )}

                {currentView === "settings" && (
                  <Settings
                    userId={currentUser.uid}
                    totalFasts={completedFasts.length}
                    totalHours={totalHours}
                    currentStreak={calculateStreak()}
                  />
                )}
              </main>
            </>
          )}
        </>
      ) : (
        <LandingPage onGetStarted={openLogin} onSignIn={openLogin} />
      )}

      {showLogin && (
        <Login
          onSwitchToSignup={switchToSignup}
          onClose={closeLogin}
          isVisible={loginModalVisible}
        />
      )}

      {showSignup && (
        <Signup
          onSwitchToLogin={switchToLogin}
          onClose={closeSignup}
          isVisible={signupModalVisible}
        />
      )}

      {/* Achievement Unlock Animation */}
      {pendingUnlock && (
        <AchievementUnlock
          achievementId={pendingUnlock}
          onClose={dismissUnlock}
        />
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
