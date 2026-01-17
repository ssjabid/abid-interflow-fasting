import { useState, useEffect, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { useFasts } from "./context/FastContext";
import { useTheme } from "./context/ThemeContext";
import { useAchievements } from "./context/AchievementContext";
import { useSubscription } from "./context/SubscriptionContext";
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
import UpgradeModal from "./components/ui/UpgradeModal";
import PaymentSuccess from "./components/PaymentSuccess";
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
  const { fasts, activeFast, startFast, endFast, updateFast, deleteFast } =
    useFasts();
  const { theme } = useTheme();
  const { checkForNewAchievements, pendingUnlock, dismissUnlock } =
    useAchievements();
  const { showUpgradeModal, setShowUpgradeModal, upgradeFeature } =
    useSubscription();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [signupModalVisible, setSignupModalVisible] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    show: boolean;
    plan: string;
  }>({
    show: false,
    plan: "",
  });
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

  // Logout modal animation handlers
  const openLogoutModal = () => {
    setShowLogoutConfirm(true);
    setTimeout(() => setLogoutModalVisible(true), 10);
  };

  const closeLogoutModal = () => {
    setLogoutModalVisible(false);
    setTimeout(() => setShowLogoutConfirm(false), 300);
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

  // Handle payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const plan = params.get("plan");

    if (payment === "success" && plan && currentUser) {
      setPaymentSuccess({ show: true, plan });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "cancelled") {
      // Clean up URL on cancel too
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [currentUser]);

  const handlePaymentComplete = () => {
    setPaymentSuccess({ show: false, plan: "" });
    setCurrentView("dashboard");
  };

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
      const updatedProfile = {
        ...profile,
        achievements: updated,
      };

      // Save to localStorage
      localStorage.setItem(
        `profile_${currentUser.uid}`,
        JSON.stringify(updatedProfile),
      );

      // Also sync to Firebase for persistence
      import("./services/profile").then(({ saveProfile }) => {
        saveProfile(currentUser.uid, updatedProfile);
      });
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
    0,
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
      (a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime(),
    );
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const fast of sortedFasts) {
      const fastDate = new Date(fast.endTime!);
      fastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (currentDate.getTime() - fastDate.getTime()) / (1000 * 60 * 60 * 24),
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
      {/* Payment Success Handler */}
      {paymentSuccess.show && currentUser && (
        <PaymentSuccess
          plan={paymentSuccess.plan}
          onComplete={handlePaymentComplete}
        />
      )}

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
                    onClick={openLogoutModal}
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
                  <History
                    fasts={fasts}
                    onDeleteFast={deleteFast}
                    onUpdateFast={updateFast}
                  />
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeFeature}
        />
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: logoutModalVisible
              ? "rgba(0, 0, 0, 0.85)"
              : "rgba(0, 0, 0, 0)",
            backdropFilter: logoutModalVisible ? "blur(8px)" : "blur(0px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "24px",
            transition: "background-color 0.3s ease, backdrop-filter 0.3s ease",
          }}
          onClick={closeLogoutModal}
        >
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              padding: "32px",
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              opacity: logoutModalVisible ? 1 : 0,
              transform: logoutModalVisible
                ? "scale(1) translateY(0)"
                : "scale(0.95) translateY(10px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: theme.colors.bgHover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                opacity: logoutModalVisible ? 1 : 0,
                transform: logoutModalVisible ? "scale(1)" : "scale(0.8)",
                transition: "opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.text}
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: theme.colors.text,
                marginBottom: "8px",
                opacity: logoutModalVisible ? 1 : 0,
                transform: logoutModalVisible
                  ? "translateY(0)"
                  : "translateY(10px)",
                transition:
                  "opacity 0.3s ease 0.15s, transform 0.3s ease 0.15s",
              }}
            >
              Log out?
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: theme.colors.textMuted,
                marginBottom: "24px",
                lineHeight: 1.5,
                opacity: logoutModalVisible ? 1 : 0,
                transform: logoutModalVisible
                  ? "translateY(0)"
                  : "translateY(10px)",
                transition: "opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s",
              }}
            >
              Are you sure you want to log out of your account?
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                opacity: logoutModalVisible ? 1 : 0,
                transform: logoutModalVisible
                  ? "translateY(0)"
                  : "translateY(10px)",
                transition:
                  "opacity 0.3s ease 0.25s, transform 0.3s ease 0.25s",
              }}
            >
              <button
                onClick={closeLogoutModal}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition:
                    "background-color 0.2s ease, border-color 0.2s ease",
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
                onClick={() => {
                  closeLogoutModal();
                  setTimeout(() => handleLogout(), 300);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: theme.colors.text,
                  border: "none",
                  color: theme.colors.bg,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
