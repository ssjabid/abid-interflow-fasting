import { useState } from "react";
import { PROTOCOLS } from "../types";
import type { UserProfile } from "../types";
import { saveProfile } from "../services/profile";

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

type Step =
  | "welcome"
  | "protocol"
  | "schedule"
  | "goals"
  | "weight"
  | "complete";

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<UserProfile>({
    dailyGoal: 16,
    weeklyGoal: 112,
    preferredProtocol: "16:8",
    weightUnit: "kg",
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  });
  const [schedule, setSchedule] = useState({
    enabled: false,
    eatingWindowStart: "12:00",
    eatingWindowEnd: "20:00",
  });

  const steps: Step[] = [
    "welcome",
    "protocol",
    "schedule",
    "goals",
    "weight",
    "complete",
  ];
  const currentIndex = steps.indexOf(currentStep);
  const progress = (currentIndex / (steps.length - 1)) * 100;

  const nextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const selectProtocol = (protocolId: string) => {
    const protocol = PROTOCOLS.find((p) => p.id === protocolId);
    if (protocol) {
      setProfile({
        ...profile,
        preferredProtocol: protocolId,
        dailyGoal: protocol.fastingHours,
        weeklyGoal: protocol.fastingHours * 7,
      });
    }
  };

  const handleComplete = async () => {
    const finalProfile: UserProfile = {
      ...profile,
      onboardingComplete: true,
      schedule: schedule.enabled
        ? {
            ...schedule,
            fastingHours: 24 - calculateEatingHours(),
            remindersBefore: 30,
          }
        : undefined,
    };

    // Save to both localStorage and Firebase
    await saveProfile(userId, finalProfile);
    onComplete();
  };

  const calculateEatingHours = () => {
    const [startH, startM] = schedule.eatingWindowStart.split(":").map(Number);
    const [endH, endM] = schedule.eatingWindowEnd.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const eatingMinutes =
      endMinutes > startMinutes
        ? endMinutes - startMinutes
        : 24 * 60 - startMinutes + endMinutes;
    return eatingMinutes / 60;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0B0B0C",
        display: "flex",
        flexDirection: "column",
        zIndex: 10000,
      }}
    >
      {/* Progress Bar */}
      {currentStep !== "welcome" && currentStep !== "complete" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            backgroundColor: "#1F1F24",
          }}
        >
          <div
            style={{
              height: "100%",
              backgroundColor: "#F5F5F5",
              width: `${progress}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
          }}
        >
          {/* Welcome Step */}
          {currentStep === "welcome" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#6B6B6B",
                  marginBottom: "24px",
                }}
              >
                INTERFLOW
              </div>

              <h1
                style={{
                  fontSize: "clamp(32px, 8vw, 48px)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "#F5F5F5",
                  marginBottom: "16px",
                  lineHeight: 1.1,
                }}
              >
                Welcome to
                <br />
                Intermittent Fasting
              </h1>

              <p
                style={{
                  fontSize: "16px",
                  color: "#6B6B6B",
                  lineHeight: 1.6,
                  marginBottom: "48px",
                  maxWidth: "360px",
                  margin: "0 auto 48px auto",
                }}
              >
                Let's set up your fasting protocol in just a few steps. It only
                takes 30 seconds.
              </p>

              <button
                onClick={nextStep}
                style={{
                  padding: "18px 48px",
                  backgroundColor: "#F5F5F5",
                  border: "none",
                  color: "#0B0B0C",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                Get Started
              </button>
            </div>
          )}

          {/* Protocol Selection Step */}
          {currentStep === "protocol" && (
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#6B6B6B",
                  marginBottom: "12px",
                }}
              >
                Step 1 of 3
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#F5F5F5",
                  marginBottom: "8px",
                }}
              >
                Choose your protocol
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#6B6B6B",
                  marginBottom: "32px",
                }}
              >
                Select the fasting schedule that fits your lifestyle.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "32px",
                }}
              >
                {PROTOCOLS.filter((p) => p.id !== "custom").map((protocol) => {
                  const isSelected = profile.preferredProtocol === protocol.id;
                  return (
                    <button
                      key={protocol.id}
                      onClick={() => selectProtocol(protocol.id)}
                      style={{
                        padding: "20px 24px",
                        backgroundColor: isSelected ? "#1F1F24" : "#101012",
                        border: `1px solid ${
                          isSelected ? "#F5F5F5" : "#1F1F24"
                        }`,
                        color: "#F5F5F5",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            marginBottom: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {protocol.name}
                          {protocol.id === "16:8" && (
                            <span
                              style={{
                                fontSize: "10px",
                                padding: "2px 8px",
                                backgroundColor: "#4ADE80",
                                color: "#0B0B0C",
                                fontWeight: 600,
                              }}
                            >
                              POPULAR
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#6B6B6B" }}>
                          {protocol.description}
                        </div>
                      </div>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: `2px solid ${
                            isSelected ? "#F5F5F5" : "#3A3A3A"
                          }`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginLeft: "16px",
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#F5F5F5",
                            }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={prevStep}
                  style={{
                    padding: "16px 24px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#6B6B6B",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    padding: "16px 24px",
                    backgroundColor: "#F5F5F5",
                    border: "none",
                    color: "#0B0B0C",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Schedule Step */}
          {currentStep === "schedule" && (
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#6B6B6B",
                  marginBottom: "12px",
                }}
              >
                Step 2 of 3
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#F5F5F5",
                  marginBottom: "8px",
                }}
              >
                Set your eating window
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#6B6B6B",
                  marginBottom: "32px",
                }}
              >
                When do you typically eat? This helps us track your fasts
                automatically.
              </p>

              {/* Enable toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  backgroundColor: "#101012",
                  border: "1px solid #1F1F24",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#F5F5F5",
                      marginBottom: "4px",
                    }}
                  >
                    Use scheduled eating window
                  </div>
                  <div style={{ fontSize: "13px", color: "#6B6B6B" }}>
                    We'll remind you when your window opens/closes
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSchedule({ ...schedule, enabled: !schedule.enabled })
                  }
                  style={{
                    width: "52px",
                    height: "32px",
                    backgroundColor: schedule.enabled ? "#4ADE80" : "#1F1F24",
                    border: "none",
                    borderRadius: "16px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.3s ease",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "#F5F5F5",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "4px",
                      left: schedule.enabled ? "24px" : "4px",
                      transition: "left 0.3s ease",
                    }}
                  />
                </button>
              </div>

              {/* Time inputs */}
              <div
                style={{
                  opacity: schedule.enabled ? 1 : 0.4,
                  pointerEvents: schedule.enabled ? "auto" : "none",
                  transition: "opacity 0.3s ease",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "32px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#6B6B6B",
                        marginBottom: "8px",
                      }}
                    >
                      Window opens
                    </label>
                    <input
                      type="time"
                      value={schedule.eatingWindowStart}
                      onChange={(e) =>
                        setSchedule({
                          ...schedule,
                          eatingWindowStart: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        backgroundColor: "#101012",
                        border: "1px solid #1F1F24",
                        padding: "16px",
                        color: "#F5F5F5",
                        fontSize: "20px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#6B6B6B",
                        marginBottom: "8px",
                      }}
                    >
                      Window closes
                    </label>
                    <input
                      type="time"
                      value={schedule.eatingWindowEnd}
                      onChange={(e) =>
                        setSchedule({
                          ...schedule,
                          eatingWindowEnd: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        backgroundColor: "#101012",
                        border: "1px solid #1F1F24",
                        padding: "16px",
                        color: "#F5F5F5",
                        fontSize: "20px",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                {/* Visual preview */}
                <div
                  style={{
                    backgroundColor: "#101012",
                    border: "1px solid #1F1F24",
                    padding: "20px",
                    marginBottom: "32px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#6B6B6B",
                      marginBottom: "12px",
                    }}
                  >
                    Your day
                  </div>
                  <div style={{ display: "flex", height: "8px", gap: "2px" }}>
                    {Array.from({ length: 24 }).map((_, i) => {
                      const startHour = parseInt(
                        schedule.eatingWindowStart.split(":")[0]
                      );
                      const endHour = parseInt(
                        schedule.eatingWindowEnd.split(":")[0]
                      );
                      const isEating =
                        endHour > startHour
                          ? i >= startHour && i < endHour
                          : i >= startHour || i < endHour;
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            backgroundColor: isEating ? "#4ADE80" : "#1F1F24",
                            transition: "background-color 0.2s ease",
                          }}
                        />
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "8px",
                      fontSize: "10px",
                      color: "#6B6B6B",
                    }}
                  >
                    <span>12am</span>
                    <span>6am</span>
                    <span>12pm</span>
                    <span>6pm</span>
                    <span>12am</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={prevStep}
                  style={{
                    padding: "16px 24px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#6B6B6B",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    padding: "16px 24px",
                    backgroundColor: "#F5F5F5",
                    border: "none",
                    color: "#0B0B0C",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Goals Step */}
          {currentStep === "goals" && (
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#6B6B6B",
                  marginBottom: "12px",
                }}
              >
                Step 3 of 3
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#F5F5F5",
                  marginBottom: "8px",
                }}
              >
                Set your goals
              </h2>

              <p
                style={{
                  fontSize: "14px",
                  color: "#6B6B6B",
                  marginBottom: "32px",
                }}
              >
                How much do you want to fast each day and week?
              </p>

              {/* Summary card */}
              <div
                style={{
                  backgroundColor: "#101012",
                  border: "1px solid #1F1F24",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#6B6B6B",
                        marginBottom: "8px",
                      }}
                    >
                      Daily Goal
                    </div>
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: 600,
                        color: "#F5F5F5",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {profile.dailyGoal}h
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#6B6B6B",
                        marginBottom: "8px",
                      }}
                    >
                      Weekly Goal
                    </div>
                    <div
                      style={{
                        fontSize: "36px",
                        fontWeight: 600,
                        color: "#F5F5F5",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {profile.weeklyGoal}h
                    </div>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div
                style={{
                  backgroundColor: "#101012",
                  border: "1px solid #1F1F24",
                  padding: "24px",
                  marginBottom: "32px",
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
                    <span style={{ fontSize: "14px", color: "#9A9A9E" }}>
                      Daily fasting hours
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#F5F5F5",
                      }}
                    >
                      {profile.dailyGoal}h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="23"
                    value={profile.dailyGoal}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        dailyGoal: Number(e.target.value),
                        weeklyGoal: Number(e.target.value) * 7,
                      })
                    }
                    style={{
                      width: "100%",
                      height: "4px",
                      appearance: "none",
                      backgroundColor: "#1F1F24",
                      cursor: "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "8px",
                      fontSize: "10px",
                      color: "#6B6B6B",
                    }}
                  >
                    <span>12h</span>
                    <span>23h</span>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: "#9A9A9E" }}>
                      Weekly fasting hours
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#F5F5F5",
                      }}
                    >
                      {profile.weeklyGoal}h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="56"
                    max="161"
                    step="7"
                    value={profile.weeklyGoal}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        weeklyGoal: Number(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      height: "4px",
                      appearance: "none",
                      backgroundColor: "#1F1F24",
                      cursor: "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "8px",
                      fontSize: "10px",
                      color: "#6B6B6B",
                    }}
                  >
                    <span>56h</span>
                    <span>161h</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={prevStep}
                  style={{
                    padding: "16px 24px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#6B6B6B",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    padding: "16px 24px",
                    backgroundColor: "#F5F5F5",
                    border: "none",
                    color: "#0B0B0C",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Weight Step */}
          {currentStep === "weight" && (
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#6B6B6B",
                  marginBottom: "16px",
                }}
              >
                Step 4 of 5
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#F5F5F5",
                  marginBottom: "8px",
                }}
              >
                Track your progress
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B6B6B",
                  marginBottom: "40px",
                }}
              >
                Add your starting weight to track changes over time. This is
                optional but helps measure your journey.
              </p>

              <div
                style={{
                  backgroundColor: "#101012",
                  border: "1px solid #1F1F24",
                  padding: "32px",
                  marginBottom: "32px",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#6B6B6B",
                      marginBottom: "12px",
                    }}
                  >
                    Current Weight (optional)
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="number"
                      value={profile.currentWeight || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          currentWeight: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                          startingWeight: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Enter weight"
                      style={{
                        flex: "1 1 150px",
                        minWidth: "150px",
                        backgroundColor: "#0B0B0C",
                        border: "1px solid #1F1F24",
                        padding: "16px",
                        color: "#F5F5F5",
                        fontSize: "18px",
                        fontWeight: 600,
                        boxSizing: "border-box",
                      }}
                    />
                    <select
                      value={profile.weightUnit}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          weightUnit: e.target.value as "kg" | "lbs",
                        })
                      }
                      style={{
                        backgroundColor: "#0B0B0C",
                        border: "1px solid #1F1F24",
                        padding: "16px 20px",
                        color: "#F5F5F5",
                        fontSize: "16px",
                        fontWeight: 500,
                        cursor: "pointer",
                        flexShrink: 0,
                        minWidth: "80px",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#6B6B6B",
                      marginBottom: "12px",
                    }}
                  >
                    Target Weight (optional)
                  </label>
                  <input
                    type="number"
                    value={profile.targetWeight || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        targetWeight: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Enter target weight"
                    style={{
                      width: "100%",
                      backgroundColor: "#0B0B0C",
                      border: "1px solid #1F1F24",
                      padding: "16px",
                      color: "#F5F5F5",
                      fontSize: "18px",
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#101012",
                  border: "1px solid #1F1F24",
                  padding: "16px",
                  marginBottom: "32px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B6B6B"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6B6B6B",
                    lineHeight: 1.6,
                  }}
                >
                  Tip: We recommend logging your weight daily for the most
                  accurate tracking. You can always update this in Statistics.
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={prevStep}
                  style={{
                    padding: "16px 24px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#6B6B6B",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  style={{
                    flex: 1,
                    padding: "16px 24px",
                    backgroundColor: "#F5F5F5",
                    border: "none",
                    color: "#0B0B0C",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {profile.currentWeight ? "Continue" : "Skip for now"}
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && (
            <div style={{ textAlign: "center" }}>
              {/* Success animation */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "0 auto 32px auto",
                  backgroundColor: "#1F1F24",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ADE80"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  color: "#F5F5F5",
                  marginBottom: "12px",
                }}
              >
                You're all set!
              </h2>

              <p
                style={{
                  fontSize: "16px",
                  color: "#6B6B6B",
                  marginBottom: "48px",
                  maxWidth: "320px",
                  margin: "0 auto 48px auto",
                }}
              >
                Your fasting journey begins now. Start your first fast whenever
                you're ready.
              </p>

              {/* Summary */}
              <div
                style={{
                  backgroundColor: "#101012",
                  border: "1px solid #1F1F24",
                  padding: "24px",
                  marginBottom: "32px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#6B6B6B",
                    marginBottom: "16px",
                  }}
                >
                  Your Setup
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#6B6B6B" }}>Protocol</span>
                    <span style={{ color: "#F5F5F5", fontWeight: 600 }}>
                      {
                        PROTOCOLS.find(
                          (p) => p.id === profile.preferredProtocol
                        )?.name
                      }
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#6B6B6B" }}>Daily Goal</span>
                    <span style={{ color: "#F5F5F5", fontWeight: 600 }}>
                      {profile.dailyGoal} hours
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#6B6B6B" }}>Weekly Goal</span>
                    <span style={{ color: "#F5F5F5", fontWeight: 600 }}>
                      {profile.weeklyGoal} hours
                    </span>
                  </div>
                  {schedule.enabled && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#6B6B6B" }}>Eating Window</span>
                      <span style={{ color: "#F5F5F5", fontWeight: 600 }}>
                        {schedule.eatingWindowStart} -{" "}
                        {schedule.eatingWindowEnd}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleComplete}
                style={{
                  width: "100%",
                  padding: "18px 48px",
                  backgroundColor: "#F5F5F5",
                  border: "none",
                  color: "#0B0B0C",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                Start Fasting
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
